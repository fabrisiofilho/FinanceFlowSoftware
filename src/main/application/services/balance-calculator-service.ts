import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { TransactionType } from '../entities/transaction.entity';
import { logger } from '@main/infrastructure/log/logger';
import { repositoryCache } from '../repositories/repository-cache';
export class BalanceCalculatorService {
  private _injectedAccountRepository: AccountRepository | null = null;
  private _injectedTransactionRepository: TransactionRepository | null = null;
  private get accountRepository(): AccountRepository {
    if (this._injectedAccountRepository) {
      return this._injectedAccountRepository;
    }
    return repositoryCache.accountRepository;
  }
  private get transactionRepository(): TransactionRepository {
    if (this._injectedTransactionRepository) {
      return this._injectedTransactionRepository;
    }
    return repositoryCache.transactionRepository;
  }
  constructor(
    accountRepository?: AccountRepository,
    transactionRepository?: TransactionRepository,
  ) {
    if (accountRepository) {
      this._injectedAccountRepository = accountRepository;
    }
    if (transactionRepository) {
      this._injectedTransactionRepository = transactionRepository;
    }
  }
  private calculateBalanceImpact(
    type: TransactionType,
    amount: number,
  ): number {
    const numericAmount = Number(amount);

    // Validar que o valor é um número válido e positivo
    if (isNaN(numericAmount) || numericAmount < 0) {
      logger.warning(`Valor inválido detectado: ${amount}, usando 0`);
      return 0;
    }

    const normalizedAmount = Math.abs(numericAmount);
    return type === 'income' ? normalizedAmount : -normalizedAmount;
  }
  async updateBalanceAfterCreate(
    userId: number,
    accountId: number,
    transactionType: TransactionType,
    amount: number,
  ): Promise<void> {
    logger.info(
      `Atualizando saldo após criação de transação: conta=${accountId}, tipo=${transactionType}, valor=${amount}`,
    );
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    const currentBalance = Number(account.balance);
    const balanceImpact = this.calculateBalanceImpact(transactionType, amount);
    const newBalance = currentBalance + balanceImpact;
    await this.accountRepository.updateBalance(accountId, userId, newBalance);
    logger.success(
      `Saldo atualizado: ${currentBalance} -> ${newBalance} (impacto: ${balanceImpact})`,
    );
  }
  async updateBalanceAfterUpdate(
    userId: number,
    accountId: number,
    oldType: TransactionType,
    oldAmount: number,
    newType: TransactionType,
    newAmount: number,
  ): Promise<void> {
    logger.info(
      `Atualizando saldo após edição de transação: conta=${accountId}`,
    );
    logger.info(`  Antigo: tipo=${oldType}, valor=${oldAmount}`);
    logger.info(`  Novo: tipo=${newType}, valor=${newAmount}`);
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    const oldImpact = this.calculateBalanceImpact(oldType, oldAmount);
    const newImpact = this.calculateBalanceImpact(newType, newAmount);
    const currentBalance = Number(account.balance);
    const newBalance = currentBalance - oldImpact + newImpact;
    await this.accountRepository.updateBalance(accountId, userId, newBalance);
    logger.success(
      `Saldo atualizado: ${currentBalance} -> ${newBalance} (reversão: ${-oldImpact}, novo: ${newImpact})`,
    );
  }
  async updateBalanceAfterDelete(
    userId: number,
    accountId: number,
    transactionType: TransactionType,
    amount: number,
  ): Promise<void> {
    logger.info(
      `Atualizando saldo após exclusão de transação: conta=${accountId}, tipo=${transactionType}, valor=${amount}`,
    );
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    const originalImpact = this.calculateBalanceImpact(transactionType, amount);
    const currentBalance = Number(account.balance);
    const newBalance = currentBalance - originalImpact;
    await this.accountRepository.updateBalance(accountId, userId, newBalance);
    logger.success(
      `Saldo atualizado após exclusão: ${currentBalance} -> ${newBalance} (reversão: ${-originalImpact})`,
    );
  }
  async updateBalanceAfterAccountChange(
    userId: number,
    oldAccountId: number,
    newAccountId: number,
    transactionType: TransactionType,
    amount: number,
  ): Promise<void> {
    logger.info(
      `Movendo transação entre contas: ${oldAccountId} -> ${newAccountId}`,
    );
    await this.updateBalanceAfterDelete(
      userId,
      oldAccountId,
      transactionType,
      amount,
    );
    await this.updateBalanceAfterCreate(
      userId,
      newAccountId,
      transactionType,
      amount,
    );
    logger.success(`Transação movida com sucesso entre contas`);
  }
  async recalculateAccountBalance(
    userId: number,
    accountId: number,
  ): Promise<number> {
    logger.info(`Recalculando saldo da conta: ${accountId}`);
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    const transactions = await this.transactionRepository.findByAccount(
      userId,
      accountId,
    );
    let calculatedBalance = 0;
    for (const transaction of transactions) {
      const impact = this.calculateBalanceImpact(
        transaction.type as TransactionType,
        Number(transaction.amount),
      );
      calculatedBalance += impact;
    }
    const oldBalance = Number(account.balance);
    await this.accountRepository.updateBalance(
      accountId,
      userId,
      calculatedBalance,
    );
    logger.success(
      `Saldo recalculado: ${oldBalance} -> ${calculatedBalance} (${transactions.length} transações)`,
    );
    return calculatedBalance;
  }
  async recalculateAllAccountBalances(
    userId: number,
  ): Promise<Map<number, number>> {
    logger.info(`Recalculando saldo de todas as contas do usuário: ${userId}`);
    const accounts = await this.accountRepository.findAllByUserId(userId);
    const balances = new Map<number, number>();
    for (const account of accounts) {
      const newBalance = await this.recalculateAccountBalance(
        userId,
        account.id,
      );
      balances.set(account.id, newBalance);
    }
    logger.success(`Saldos recalculados para ${accounts.length} contas`);
    return balances;
  }
  async verifyAccountBalanceConsistency(
    userId: number,
    accountId: number,
  ): Promise<{
    isConsistent: boolean;
    currentBalance: number;
    calculatedBalance: number;
    difference: number;
  }> {
    logger.info(`Verificando consistência do saldo da conta: ${accountId}`);
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    const currentBalance = Number(account.balance);
    const transactions = await this.transactionRepository.findByAccount(
      userId,
      accountId,
    );
    let calculatedBalance = 0;
    for (const transaction of transactions) {
      const impact = this.calculateBalanceImpact(
        transaction.type as TransactionType,
        Number(transaction.amount),
      );
      calculatedBalance += impact;
    }
    const difference = Math.abs(currentBalance - calculatedBalance);
    const isConsistent = difference < 0.01;

    logger.info(
      `Consistência: atual=${currentBalance}, calculado=${calculatedBalance}, diferença=${difference}`,
    );
    return {
      isConsistent,
      currentBalance,
      calculatedBalance,
      difference,
    };
  }
}
