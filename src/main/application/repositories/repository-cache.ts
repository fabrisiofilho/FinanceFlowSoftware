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

  // Flags para controle de inicialização (evita race conditions)
  private _accountRepositoryInitializing = false;
  private _alertRepositoryInitializing = false;
  private _categoryRepositoryInitializing = false;
  private _creditCardInvoiceRepositoryInitializing = false;
  private _financeUserRepositoryInitializing = false;
  private _goalContributionRepositoryInitializing = false;
  private _goalRepositoryInitializing = false;
  private _transactionRepositoryInitializing = false;

  get accountRepository(): AccountRepository {
    if (!this._accountRepository && !this._accountRepositoryInitializing) {
      this._accountRepositoryInitializing = true;
      this._accountRepository = new AccountRepository();
      this._accountRepositoryInitializing = false;
    }
    return this._accountRepository!;
  }

  get alertRepository(): AlertRepository {
    if (!this._alertRepository && !this._alertRepositoryInitializing) {
      this._alertRepositoryInitializing = true;
      this._alertRepository = new AlertRepository();
      this._alertRepositoryInitializing = false;
    }
    return this._alertRepository!;
  }

  get categoryRepository(): CategoryRepository {
    if (!this._categoryRepository && !this._categoryRepositoryInitializing) {
      this._categoryRepositoryInitializing = true;
      this._categoryRepository = new CategoryRepository();
      this._categoryRepositoryInitializing = false;
    }
    return this._categoryRepository!;
  }

  get creditCardInvoiceRepository(): CreditCardInvoiceRepository {
    if (
      !this._creditCardInvoiceRepository &&
      !this._creditCardInvoiceRepositoryInitializing
    ) {
      this._creditCardInvoiceRepositoryInitializing = true;
      this._creditCardInvoiceRepository = new CreditCardInvoiceRepository();
      this._creditCardInvoiceRepositoryInitializing = false;
    }
    return this._creditCardInvoiceRepository!;
  }

  get financeUserRepository(): FinanceUserRepository {
    if (
      !this._financeUserRepository &&
      !this._financeUserRepositoryInitializing
    ) {
      this._financeUserRepositoryInitializing = true;
      this._financeUserRepository = new FinanceUserRepository();
      this._financeUserRepositoryInitializing = false;
    }
    return this._financeUserRepository!;
  }

  get goalContributionRepository(): GoalContributionRepository {
    if (
      !this._goalContributionRepository &&
      !this._goalContributionRepositoryInitializing
    ) {
      this._goalContributionRepositoryInitializing = true;
      this._goalContributionRepository = new GoalContributionRepository();
      this._goalContributionRepositoryInitializing = false;
    }
    return this._goalContributionRepository!;
  }

  get goalRepository(): GoalRepository {
    if (!this._goalRepository && !this._goalRepositoryInitializing) {
      this._goalRepositoryInitializing = true;
      this._goalRepository = new GoalRepository();
      this._goalRepositoryInitializing = false;
    }
    return this._goalRepository!;
  }

  get transactionRepository(): TransactionRepository {
    if (
      !this._transactionRepository &&
      !this._transactionRepositoryInitializing
    ) {
      this._transactionRepositoryInitializing = true;
      this._transactionRepository = new TransactionRepository();
      this._transactionRepositoryInitializing = false;
    }
    return this._transactionRepository!;
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

    // Reset flags
    this._accountRepositoryInitializing = false;
    this._alertRepositoryInitializing = false;
    this._categoryRepositoryInitializing = false;
    this._creditCardInvoiceRepositoryInitializing = false;
    this._financeUserRepositoryInitializing = false;
    this._goalContributionRepositoryInitializing = false;
    this._goalRepositoryInitializing = false;
    this._transactionRepositoryInitializing = false;
  }
}

export const repositoryCache = new RepositoryCache();
