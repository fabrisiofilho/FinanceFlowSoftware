import { AccountRepository } from './account-repository';
import { AlertRepository } from './alert-repository';
import { CategoryRepository } from './category-repository';
import { CreditCardInvoiceRepository } from './credit-card-invoice-repository';
import { FinanceUserRepository } from './finance-user-repository';
import { GoalContributionRepository } from './goal-contribution-repository';
import { GoalRepository } from './goal-repository';
import { TransactionRepository } from './transaction-repository';
class RepositoryCache {
  private _accountRepository: AccountRepository | null = null;
  private _alertRepository: AlertRepository | null = null;
  private _categoryRepository: CategoryRepository | null = null;
  private _creditCardInvoiceRepository: CreditCardInvoiceRepository | null =
    null;
  private _financeUserRepository: FinanceUserRepository | null = null;
  private _goalContributionRepository: GoalContributionRepository | null = null;
  private _goalRepository: GoalRepository | null = null;
  private _transactionRepository: TransactionRepository | null = null;
  get accountRepository(): AccountRepository {
    if (!this._accountRepository) {
      this._accountRepository = new AccountRepository();
    }
    return this._accountRepository;
  }
  get alertRepository(): AlertRepository {
    if (!this._alertRepository) {
      this._alertRepository = new AlertRepository();
    }
    return this._alertRepository;
  }
  get categoryRepository(): CategoryRepository {
    if (!this._categoryRepository) {
      this._categoryRepository = new CategoryRepository();
    }
    return this._categoryRepository;
  }
  get creditCardInvoiceRepository(): CreditCardInvoiceRepository {
    if (!this._creditCardInvoiceRepository) {
      this._creditCardInvoiceRepository = new CreditCardInvoiceRepository();
    }
    return this._creditCardInvoiceRepository;
  }
  get financeUserRepository(): FinanceUserRepository {
    if (!this._financeUserRepository) {
      this._financeUserRepository = new FinanceUserRepository();
    }
    return this._financeUserRepository;
  }
  get goalContributionRepository(): GoalContributionRepository {
    if (!this._goalContributionRepository) {
      this._goalContributionRepository = new GoalContributionRepository();
    }
    return this._goalContributionRepository;
  }
  get goalRepository(): GoalRepository {
    if (!this._goalRepository) {
      this._goalRepository = new GoalRepository();
    }
    return this._goalRepository;
  }
  get transactionRepository(): TransactionRepository {
    if (!this._transactionRepository) {
      this._transactionRepository = new TransactionRepository();
    }
    return this._transactionRepository;
  }
  clear(): void {
    this._accountRepository = null;
    this._alertRepository = null;
    this._categoryRepository = null;
    this._creditCardInvoiceRepository = null;
    this._financeUserRepository = null;
    this._goalContributionRepository = null;
    this._goalRepository = null;
    this._transactionRepository = null;
  }
}
export const repositoryCache = new RepositoryCache();
