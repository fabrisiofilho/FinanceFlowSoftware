import { amountToCents } from '@shared/finance/entry-schedule';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { moneyColumn } from '@main/infrastructure/database/money-column';
import { AccountEntity } from '../entities/account.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  Account,
  AccountType,
  CardBrand,
  CreateAccountInput,
  UpdateAccountInput,
} from '@shared/interfaces/types/account.types';
import { repositoryCache } from '../repositories/repository-cache';
export class AccountService {
  private static readonly MIN_CLOSING_DAY = 1;
  private static readonly MAX_CLOSING_DAY = 31;
  private get accountRepository() {
    return repositoryCache.accountRepository;
  }
  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }
  private mapEntityToAccount(entity: AccountEntity): Account {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type as AccountType,
      balance: Number(entity.balance),
      creditLimit: entity.creditLimit ? Number(entity.creditLimit) : undefined,
      closingDay: entity.closingDay ?? undefined,
      cardColor: entity.cardColor ?? undefined,
      imageData: entity.imageData,
      dueDay: entity.dueDay,
      cardBrand: entity.cardBrand as CardBrand | undefined,
      bankName: entity.bankName ?? undefined,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  private validateIdentity(
    data: CreateAccountInput | UpdateAccountInput,
  ): void {
    if (data.cardColor !== undefined && !/^#[0-9a-f]{6}$/i.test(data.cardColor))
      throw new Error('Cor inválida.');
    if (
      data.dueDay !== undefined &&
      (!Number.isInteger(data.dueDay) || data.dueDay < 1 || data.dueDay > 31)
    )
      throw new Error('Vencimento deve estar entre 1 e 31.');
    if (data.imageData != null) {
      if (
        typeof data.imageData !== 'string' ||
        data.imageData.length > 700000 ||
        !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(
          data.imageData,
        )
      )
        throw new Error('Use imagem PNG, JPEG ou WebP de até 500 KB.');
      const bytes = Buffer.from(data.imageData.split(',')[1], 'base64');
      const valid =
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
        (bytes.toString('ascii', 0, 4) === 'RIFF' &&
          bytes.toString('ascii', 8, 12) === 'WEBP');
      if (!valid || bytes.length > 512000)
        throw new Error('Imagem inválida ou muito grande.');
    }
  }
  private validateCreateInput(data: CreateAccountInput): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da conta é obrigatório');
    }
    if (!data.type) {
      throw new Error('Tipo da conta é obrigatório');
    }
    const validTypes: AccountType[] = [
      'checking',
      'savings',
      'credit_card',
      'wallet',
    ];
    if (!validTypes.includes(data.type)) {
      throw new Error('Tipo de conta inválido');
    }
    if (data.type === 'credit_card') {
      amountToCents(data.creditLimit!);
      if (data.creditLimit === undefined || data.creditLimit === null) {
        throw new Error(
          'Limite de crédito é obrigatório para cartão de crédito',
        );
      }
      if (data.creditLimit <= 0) {
        throw new Error('Limite de crédito deve ser maior que zero');
      }
      if (data.closingDay === undefined || data.closingDay === null) {
        throw new Error(
          'Dia de fechamento é obrigatório para cartão de crédito',
        );
      }
      if (
        !Number.isInteger(data.closingDay) ||
        data.closingDay < AccountService.MIN_CLOSING_DAY ||
        data.closingDay > AccountService.MAX_CLOSING_DAY
      ) {
        throw new Error(
          `Dia de fechamento deve estar entre ${AccountService.MIN_CLOSING_DAY} e ${AccountService.MAX_CLOSING_DAY}`,
        );
      }
    }
    if (
      data.balance !== undefined &&
      data.balance !== null &&
      (!Number.isFinite(data.balance) ||
        !Number.isSafeInteger(Math.round(data.balance * 100)) ||
        Math.abs(data.balance * 100 - Math.round(data.balance * 100)) >
          0.000001)
    ) {
      throw new Error('Saldo inicial inválido');
    }
  }
  private validateUpdateInput(
    data: UpdateAccountInput,
    currentType: AccountType,
  ): void {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da conta não pode ser vazio');
    }
    if (currentType === 'credit_card') {
      if (data.creditLimit !== undefined) amountToCents(data.creditLimit);
      if (data.creditLimit !== undefined && data.creditLimit <= 0) {
        throw new Error('Limite de crédito deve ser maior que zero');
      }
      if (data.closingDay !== undefined) {
        if (
          !Number.isInteger(data.closingDay) ||
          data.closingDay < AccountService.MIN_CLOSING_DAY ||
          data.closingDay > AccountService.MAX_CLOSING_DAY
        ) {
          throw new Error(
            `Dia de fechamento deve estar entre ${AccountService.MIN_CLOSING_DAY} e ${AccountService.MAX_CLOSING_DAY}`,
          );
        }
      }
    }
  }
  async create(userId: number, data: CreateAccountInput): Promise<Account> {
    logger.info('Criando nova conta para usuário:', userId);
    this.validateCreateInput(data);
    this.validateIdentity(data);
    const accountData: Partial<AccountEntity> = {
      name: data.name.trim(),
      type: data.type,
      balance: data.balance ?? 0,
      initialBalance: data.balance ?? 0,
      imageData: data.imageData,
      cardColor: data.cardColor,
      bankName: data.bankName,
      dueDay: data.dueDay,
    };
    if (data.type === 'credit_card') {
      accountData.creditLimit = data.creditLimit;
      accountData.closingDay = data.closingDay;
      accountData.cardColor = data.cardColor;
      accountData.cardBrand = data.cardBrand;
      accountData.bankName = data.bankName;
    }
    const accountEntity = await this.accountRepository.createAccount({
      ...accountData,
      userId,
    });
    logger.success('Conta criada com sucesso:', accountEntity.name);
    return this.mapEntityToAccount(accountEntity);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateAccountInput,
  ): Promise<Account> {
    logger.info('Atualizando conta:', id);
    const existingAccount = await this.accountRepository.findById(id, userId);
    if (!existingAccount) {
      throw new Error('Conta não encontrada');
    }
    this.validateUpdateInput(data, existingAccount.type as AccountType);
    this.validateIdentity(data);
    const updateData: Partial<AccountEntity> = {};
    for (const key of [
      'imageData',
      'cardColor',
      'bankName',
      'dueDay',
    ] as const) {
      if (data[key] !== undefined)
        Object.assign(updateData, { [key]: data[key] });
    }
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (existingAccount.type === 'credit_card') {
      if (data.creditLimit !== undefined) {
        updateData.creditLimit = data.creditLimit;
      }
      if (data.closingDay !== undefined) {
        updateData.closingDay = data.closingDay;
      }
      if (data.cardColor !== undefined) {
        updateData.cardColor = data.cardColor;
      }
      if (data.cardBrand !== undefined) {
        updateData.cardBrand = data.cardBrand;
      }
      if (data.bankName !== undefined) {
        updateData.bankName = data.bankName;
      }
    }
    const updatedEntity = await this.accountRepository.updateAccount(
      id,
      userId,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar conta');
    }
    logger.success('Conta atualizada com sucesso:', updatedEntity.name);
    return this.mapEntityToAccount(updatedEntity);
  }
  async delete(userId: number, id: number): Promise<void> {
    logger.info('Excluindo conta:', id);
    const existingAccount = await this.accountRepository.findById(id, userId);
    if (!existingAccount) {
      throw new Error('Conta não encontrada');
    }
    const transactionCount =
      await this.transactionRepository.countByAccount(id);
    if (transactionCount > 0) {
      throw new Error(
        `Não é possível excluir conta com transações vinculadas. Existem ${transactionCount} transação(ões) vinculada(s).`,
      );
    }
    await this.accountRepository.deleteAccount(id, userId);
    logger.success('Conta excluída com sucesso:', existingAccount.name);
  }
  async findById(userId: number, id: number): Promise<Account | null> {
    const accountEntity = await this.accountRepository.findById(id, userId);
    if (!accountEntity) {
      return null;
    }
    return this.mapEntityToAccount(accountEntity);
  }
  async findAll(userId: number): Promise<Account[]> {
    const accounts = await this.accountRepository.findAllByUserId(userId);
    return accounts.map((entity) => this.mapEntityToAccount(entity));
  }
  async findByType(userId: number, type: AccountType): Promise<Account[]> {
    const accounts = await this.accountRepository.findByType(userId, type);
    return accounts.map((entity) => this.mapEntityToAccount(entity));
  }
  async getBalance(userId: number, id: number): Promise<number> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    return Number(account.balance);
  }
  async getTotalBalance(userId: number): Promise<number> {
    return await this.accountRepository.getTotalBalance(userId);
  }
  async updateBalance(
    userId: number,
    id: number,
    newBalance: number,
  ): Promise<void> {
    const cents = moneyColumn.to(newBalance) as number;
    await financialTransaction(async (manager) => {
      const account = await manager
        .getRepository(AccountEntity)
        .findOneBy({ id, userId });
      if (!account) throw new Error('Conta não encontrada');
      const adjustment = cents - Math.round(account.balance * 100);
      if (!Number.isSafeInteger(adjustment))
        throw new Error('Ajuste excede o limite monetário.');
      await manager.query(
        'INSERT INTO balance_adjustments(user_id,account_id,delta_cents,reason) VALUES(?,?,?,?)',
        [userId, id, adjustment, 'Ajuste manual de saldo'],
      );
      await manager
        .getRepository(AccountEntity)
        .update({ id, userId }, { balance: newBalance });
    });
  }

  async findCreditCards(userId: number): Promise<Account[]> {
    const accounts = await this.accountRepository.findCreditCards(userId);
    return accounts.map((entity) => this.mapEntityToAccount(entity));
  }
  async hasNegativeBalance(userId: number, id: number): Promise<boolean> {
    const balance = await this.getBalance(userId, id);
    return balance < 0;
  }
  async getAvailableLimit(userId: number, id: number): Promise<number> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      throw new Error('Esta conta não é um cartão de crédito');
    }
    const creditLimit = Number(account.creditLimit) || 0;
    const usedLimit = Math.abs(Number(account.balance));
    return creditLimit - usedLimit;
  }
  async isLimitNearExhaustion(userId: number, id: number): Promise<boolean> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      return false;
    }
    const creditLimit = Number(account.creditLimit) || 0;
    if (creditLimit === 0) {
      return false;
    }
    const usedLimit = Math.abs(Number(account.balance));
    const usagePercentage = (usedLimit / creditLimit) * 100;
    return usagePercentage >= 80;
  }
}
