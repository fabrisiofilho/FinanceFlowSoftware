import { IImportController } from '@shared/interfaces/controllers/import.controller.interface';
import { ImportService } from '../services/import-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  ImportResult,
  ImportPreview,
  ImportConfig,
  CSVPreviewData,
  ParsedTransaction,
} from '@shared/interfaces/types/import.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class ImportController extends BaseHandler implements IImportController {
  private _importService: ImportService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get importService(): ImportService {
    if (!this._importService) {
      this._importService = new ImportService();
    }
    return this._importService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('import:getCSVPreview')
  async getCSVPreview(
    csvContent: string,
  ): Promise<ApiResponse<CSVPreviewData>> {
    return wrap(async () => {
      return await this.importService.getCSVPreview(csvContent);
    })();
  }

  @IpcMethod('import:previewImport')
  async previewImport(
    csvContent: string,
    config: ImportConfig,
  ): Promise<ApiResponse<ImportPreview>> {
    return wrap(async () => {
      return await this.importService.previewImport(csvContent, config);
    })();
  }

  @IpcMethod('import:importCSV')
  async importCSV(
    _csvContent: string,
    config: ImportConfig,
    transactions: ParsedTransaction[],
  ): Promise<ApiResponse<ImportResult>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.importService.importTransactions(
        userId,
        config,
        transactions,
      );
    })();
  }
}
