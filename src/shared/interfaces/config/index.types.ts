import { IFinanceAuthController } from '../controllers/finance-auth.controller.interface';
import { IAccountController } from '../controllers/account.controller.interface';
import { ICategoryController } from '../controllers/category.controller.interface';
import { ITransactionController } from '../controllers/transaction.controller.interface';
import { IGoalController } from '../controllers/goal.controller.interface';
import { IAlertController } from '../controllers/alert.controller.interface';
import { ICreditCardController } from '../controllers/credit-card.controller.interface';
import { IReportController } from '../controllers/report.controller.interface';
import { IImportController } from '../controllers/import.controller.interface';
import {
  IAutoUpdaterController,
  UpdateState,
} from '../types/auto-updater.types';

export interface CustomElectronAPI {
  financeAuth: IFinanceAuthController;
  account: IAccountController;
  category: ICategoryController;
  transaction: ITransactionController;
  goal: IGoalController;
  alert: IAlertController;
  creditCard: ICreditCardController;
  report: IReportController;
  import: IImportController;

  autoUpdater: IAutoUpdaterController;

  openExternalUrl: (url: string) => void;

  onAutoUpdaterStatus: (callback: (state: UpdateState) => void) => () => void;
}
