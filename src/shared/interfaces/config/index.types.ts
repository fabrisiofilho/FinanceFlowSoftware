import type { BackupAPI } from '../types/backup.types';
import type { InvestmentAPI } from '../types/investment.types';
import { IFinanceAuthController } from '../controllers/finance-auth.controller.interface';
import { IAccountController } from '../controllers/account.controller.interface';
import { ICategoryController } from '../controllers/category.controller.interface';
import { ITransactionController } from '../controllers/transaction.controller.interface';
import { IGoalController } from '../controllers/goal.controller.interface';
import { IAlertController } from '../controllers/alert.controller.interface';
import { ICreditCardController } from '../controllers/credit-card.controller.interface';
import { IReportController } from '../controllers/report.controller.interface';
import { IImportController } from '../controllers/import.controller.interface';
import { IBudgetController } from '../controllers/budget.controller.interface';
import { ITransferController } from '../controllers/transfer.controller.interface';
import { IRecurringController } from '../controllers/recurring.controller.interface';
import { ICashFlowController } from '../controllers/cash-flow.controller.interface';
import { IAdvancedReportController } from '../controllers/advanced-report.controller.interface';
import { IBankImportController } from '../controllers/bank-import.controller.interface';
import { ITagController } from '../controllers/tag.controller.interface';
import { INotificationController } from '../controllers/notification.controller.interface';
import { ICurrencyController } from '../controllers/currency.controller.interface';
import { IAttachmentController } from '../controllers/attachment.controller.interface';
import {
  IAutoUpdaterController,
  UpdateState,
} from '../types/auto-updater.types';

export interface IpcResultEvent {
  channel: string;
  success: boolean;
  error?: string;
}

export interface CustomElectronAPI {
  backup: BackupAPI;
  investment: InvestmentAPI;
  financeAuth: IFinanceAuthController;
  account: IAccountController;
  category: ICategoryController;
  transaction: ITransactionController;
  goal: IGoalController;
  alert: IAlertController;
  creditCard: ICreditCardController;
  report: IReportController;
  import: IImportController;
  budget: IBudgetController;
  transfer: ITransferController;
  recurring: IRecurringController;
  cashFlow: ICashFlowController;
  advancedReport: IAdvancedReportController;
  bankImport: IBankImportController;
  tag: ITagController;
  notification: INotificationController;
  currency: ICurrencyController;
  attachment: IAttachmentController;

  autoUpdater: IAutoUpdaterController;

  openExternalUrl: (url: string) => void;
  windowControls: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
  };

  onAutoUpdaterStatus: (callback: (state: UpdateState) => void) => () => void;

  onIpcResult: (callback: (event: IpcResultEvent) => void) => () => void;
}
