import { ICreditCardController } from '@shared/interfaces/controllers/credit-card.controller.interface';
import { CreditCardService } from '../services/credit-card-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  CreditCardInvoice,
  CreditCardSummary,
  InvoiceFilters,
  PayInvoiceInput,
  PayInvoiceResult,
} from '@shared/interfaces/types/credit-card.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class CreditCardController
  extends BaseHandler
  implements ICreditCardController
{
  private _creditCardService: CreditCardService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get creditCardService(): CreditCardService {
    if (!this._creditCardService) {
      this._creditCardService = new CreditCardService();
    }
    return this._creditCardService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('creditCard:getInvoices')
  async getInvoices(
    filters?: InvoiceFilters,
  ): Promise<ApiResponse<CreditCardInvoice[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.creditCardService.getInvoices(userId, filters);
    })();
  }
  @IpcMethod('creditCard:getInvoiceDetails')
  async getInvoiceDetails(
    invoiceId: number,
  ): Promise<ApiResponse<CreditCardInvoice>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.creditCardService.getInvoiceDetails(userId, invoiceId);
    })();
  }
  @IpcMethod('creditCard:payInvoice')
  async payInvoice(
    data: PayInvoiceInput,
  ): Promise<ApiResponse<PayInvoiceResult>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.creditCardService.payInvoice(userId, data);
    })();
  }
  @IpcMethod('creditCard:getCreditCardsSummary')
  async getCreditCardsSummary(): Promise<ApiResponse<CreditCardSummary[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.creditCardService.getCreditCardsSummary(userId);
    })();
  }
  @IpcMethod('creditCard:getCreditCardSummary')
  async getCreditCardSummary(
    accountId: number,
  ): Promise<ApiResponse<CreditCardSummary>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.creditCardService.getCreditCardSummary(
        userId,
        accountId,
      );
    })();
  }
  @IpcMethod('creditCard:closeCurrentInvoice')
  async closeCurrentInvoice(
    accountId: number,
  ): Promise<ApiResponse<CreditCardInvoice>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const invoices = await this.creditCardService.getInvoices(userId, {
        accountId,
        status: 'open',
      });
      if (invoices.length === 0) {
        throw new Error('Não há fatura aberta para este cartão');
      }
      const currentInvoice = invoices.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })[0];
      return await this.creditCardService.closeInvoice(
        userId,
        currentInvoice.id,
      );
    })();
  }
}
