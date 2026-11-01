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
      cardBrand: entity.cardBrand as CardBrand | undefined,
      bankName: entity.bankName ?? undefined,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
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
      isNaN(data.balance)
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
      if (data.creditLimit !== undefined && data.creditLimit <= 0) {
        throw new Error('Limite de crédito deve ser maior que zero');
      }
      if (data.closingDay !== undefined) {
        if (
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
    const accountData: Partial<AccountEntity> = {
      name: data.name.trim(),
      type: data.type,
      balance: data.balance ?? 0,
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
    const updateData: Partial<AccountEntity> = {};
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
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    await this.accountRepository.updateBalance(id, userId, newBalance);
    logger.info(`Saldo da conta ${id} atualizado para ${newBalance}`);
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
