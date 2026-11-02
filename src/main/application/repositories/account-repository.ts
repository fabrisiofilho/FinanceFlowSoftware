import { BaseRepository } from './base-repository';
import { AccountEntity, AccountType } from '../entities/account.entity';
import { EntityManager } from 'typeorm';
export class AccountRepository extends BaseRepository<AccountEntity> {
  constructor(manager?: EntityManager) {
    super(AccountEntity, manager);
  }
  async findById(id: number, userId: number): Promise<AccountEntity | null> {
    return await this.findOneBy({ id, userId });
  }
  async findAllByUserId(userId: number): Promise<AccountEntity[]> {
    return await this.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }
  async findByType(
    userId: number,
    type: AccountType,
  ): Promise<AccountEntity[]> {
    return await this.find({
      where: { userId, type },
      order: { name: 'ASC' },
    });
  }
  async findCreditCards(userId: number): Promise<AccountEntity[]> {
    return await this.findByType(userId, 'credit_card');
  }
  async findByName(
    userId: number,
    name: string,
  ): Promise<AccountEntity | null> {
    return await this.findOneBy({ userId, name });
  }
  async createAccount(
    accountData: Partial<AccountEntity> & { userId: number },
  ): Promise<AccountEntity> {
    return await this.save(accountData);
  }
  async updateAccount(
    id: number,
    userId: number,
    accountData: Partial<AccountEntity>,
  ): Promise<AccountEntity | null> {
    await this.update({ id, userId }, accountData);
    return await this.findById(id, userId);
  }
  async deleteAccount(id: number, userId: number): Promise<void> {
    await this.delete({ id, userId });
  }
  async externalBalanceImpact(userId: number, id: number): Promise<number> {
    const [row] = await this.repository.manager.query(
      "SELECT COALESCE((SELECT SUM(CASE WHEN kind IN ('initial','deposit') THEN -amount_cents WHEN kind='withdrawal' THEN amount_cents ELSE 0 END) FROM investment_events WHERE account_id=? AND user_id=?),0)-COALESCE((SELECT SUM(total_amount) FROM credit_card_invoices WHERE payment_account_id=? AND status='paid'),0) +COALESCE((SELECT SUM(delta_cents) FROM balance_adjustments WHERE account_id=? AND user_id=?),0) AS cents",
      [id, userId, id, id, userId],
    );
    return Number(row.cents) / 100;
  }
  async getTotalBalance(userId: number): Promise<number> {
    try {
      const accounts = await this.findAllByUserId(userId);
      return accounts
        .filter((account) => account.type !== 'credit_card')
        .reduce((total, account) => total + Number(account.balance), 0);
    } catch (error) {
      const err = error as Error;
      console.error('Erro em getTotalBalance:', err.message);
      console.error('Stack:', err.stack);
      throw error;
    }
  }
  async updateBalance(
    id: number,
    userId: number,
    newBalance: number,
  ): Promise<void> {
    await this.update({ id, userId }, { balance: newBalance });
  }
}
