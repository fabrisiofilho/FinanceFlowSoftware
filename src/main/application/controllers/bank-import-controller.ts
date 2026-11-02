import { BankImportService } from '../services/bank-import-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  BankImport,
  BankImportTransaction,
  CreateBankImportInput,
  ProcessImportInput,
  BankImportResult,
  ReconciliationSuggestion,
} from '@shared/interfaces/types/bank-import.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class BankImportController extends BaseHandler {
  private _bankImportService: BankImportService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get bankImportService(): BankImportService {
    if (!this._bankImportService) {
      this._bankImportService = new BankImportService();
    }
    return this._bankImportService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('bankImport:create')
  async create(data: CreateBankImportInput): Promise<ApiResponse<BankImport>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.bankImportService.createImport(userId, data);
    })();
  }

  @IpcMethod('bankImport:process')
  async process(
    data: ProcessImportInput,
  ): Promise<ApiResponse<BankImportResult>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.bankImportService.processImport(userId, data);
    })();
  }

  @IpcMethod('bankImport:findById')
  async findById(id: number): Promise<ApiResponse<BankImport>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const bankImport = await this.bankImportService.getImport(userId, id);
      if (!bankImport) {
        throw new Error('Importação não encontrada');
      }
      return bankImport;
    })();
  }

  @IpcMethod('bankImport:getTransactions')
  async getTransactions(
    importId: number,
  ): Promise<ApiResponse<BankImportTransaction[]>> {
    return wrap(async () => {
      return await this.bankImportService.getImportTransactions(
        this.getUserId(),
        importId,
      );
    })();
  }

  @IpcMethod('bankImport:getReconciliationSuggestions')
  async getReconciliationSuggestions(
    importId: number,
  ): Promise<ApiResponse<ReconciliationSuggestion[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.bankImportService.getReconciliationSuggestions(
        userId,
        importId,
      );
    })();
  }

  @IpcMethod('bankImport:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.bankImportService.deleteImport(userId, id);
    })();
  }
}
