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

export function loadIpcControllers() {
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

  logger.info('All IPC controllers loaded successfully');
}
