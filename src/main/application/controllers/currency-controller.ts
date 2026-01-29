import { CurrencyService } from '../services/currency-service';
import type {
  Currency,
  CreateCurrencyInput,
  UpdateCurrencyInput,
  CurrencyConversion,
} from '@shared/interfaces/types/currency.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class CurrencyController extends BaseHandler {
  private _currencyService: CurrencyService | null = null;

  private get currencyService(): CurrencyService {
    if (!this._currencyService) {
      this._currencyService = new CurrencyService();
    }
    return this._currencyService;
  }

  @IpcMethod('currency:create')
  async create(data: CreateCurrencyInput): Promise<ApiResponse<Currency>> {
    return wrap(async () => {
      return await this.currencyService.create(data);
    })();
  }

  @IpcMethod('currency:update')
  async update(
    id: number,
    data: UpdateCurrencyInput,
  ): Promise<ApiResponse<Currency>> {
    return wrap(async () => {
      return await this.currencyService.update(id, data);
    })();
  }

  @IpcMethod('currency:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.currencyService.delete(id);
    })();
  }

  @IpcMethod('currency:findAll')
  async findAll(): Promise<ApiResponse<Currency[]>> {
    return wrap(async () => {
      return await this.currencyService.findAll();
    })();
  }

  @IpcMethod('currency:findByCode')
  async findByCode(code: string): Promise<ApiResponse<Currency>> {
    return wrap(async () => {
      const currency = await this.currencyService.findByCode(code);
      if (!currency) {
        throw new Error('Moeda não encontrada');
      }
      return currency;
    })();
  }

  @IpcMethod('currency:getDefault')
  async getDefault(): Promise<ApiResponse<Currency>> {
    return wrap(async () => {
      return await this.currencyService.getDefault();
    })();
  }

  @IpcMethod('currency:setDefault')
  async setDefault(id: number): Promise<ApiResponse<Currency>> {
    return wrap(async () => {
      return await this.currencyService.setDefault(id);
    })();
  }

  @IpcMethod('currency:convert')
  async convert(
    fromCode: string,
    toCode: string,
    amount: number,
  ): Promise<ApiResponse<CurrencyConversion>> {
    return wrap(async () => {
      return await this.currencyService.convert(fromCode, toCode, amount);
    })();
  }

  @IpcMethod('currency:updateRates')
  async updateRates(
    rates: { code: string; rate: number }[],
  ): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.currencyService.updateExchangeRates(rates);
    })();
  }
}
