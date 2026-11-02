import { ExternalLinkController } from '../external-link-controller';
import { OnboardingController } from '../onboarding-controller';
import { ListingController } from '../listing-controller';
import { BackupController } from '../backup-controller';
import { InvestmentController } from '../investment-controller';
import { logger } from '@main/infrastructure/log/logger';
import { AutoUpdaterController } from '../auto-updater-controller';
import { FinanceAuthController } from '../finance-auth-controller';
import { AccountController } from '../account-controller';
import { CategoryController } from '../category-controller';
import { TransactionController } from '../transaction-controller';
import { GoalController } from '../goal-controller';
import { AlertController } from '../alert-controller';
import { CreditCardController } from '../credit-card-controller';
import { ReportController } from '../report-controller';
import { ImportController } from '../import-controller';
import { BudgetController } from '../budget-controller';
import { TagController } from '../tag-controller';
import { TransferController } from '../transfer-controller';
import { NotificationController } from '../notification-controller';
import { RecurringTransactionController } from '../recurring-transaction-controller';
import { BankImportController } from '../bank-import-controller';
import { AdvancedReportController } from '../advanced-report-controller';
import { CashFlowController } from '../cash-flow-controller';
import { CurrencyController } from '../currency-controller';
import { AttachmentController } from '../attachment-controller';

export function loadIpcControllers() {
  new ListingController();
  new ExternalLinkController();
  new OnboardingController();
  new InvestmentController();
  new BackupController();
  logger.info('Loading IPC controllers...');

  logger.info('Loading AutoUpdaterController...');
  new AutoUpdaterController();

  logger.info('Loading FinanceAuthController...');
  new FinanceAuthController();

  logger.info('Loading AccountController...');
  new AccountController();

  logger.info('Loading CategoryController...');
  new CategoryController();

  logger.info('Loading TransactionController...');
  new TransactionController();

  logger.info('Loading GoalController...');
  new GoalController();

  logger.info('Loading AlertController...');
  new AlertController();

  logger.info('Loading CreditCardController...');
  new CreditCardController();

  logger.info('Loading ReportController...');
  new ReportController();

  logger.info('Loading ImportController...');
  new ImportController();

  logger.info('Loading BudgetController...');
  new BudgetController();

  logger.info('Loading TagController...');
  new TagController();

  logger.info('Loading TransferController...');
  new TransferController();

  logger.info('Loading NotificationController...');
  new NotificationController();

  logger.info('Loading RecurringTransactionController...');
  new RecurringTransactionController();

  logger.info('Loading BankImportController...');
  new BankImportController();

  logger.info('Loading AdvancedReportController...');
  new AdvancedReportController();

  logger.info('Loading CashFlowController...');
  new CashFlowController();

  logger.info('Loading CurrencyController...');
  new CurrencyController();

  logger.info('Loading AttachmentController...');
  new AttachmentController();

  logger.info('All IPC controllers loaded successfully');
}
