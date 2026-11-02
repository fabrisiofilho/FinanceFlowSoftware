import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
import { FinanceAuthService } from '../services/finance-auth-service';
import { FinancingService } from '../services/financing-service';
import type { FinancingInput } from '@shared/finance/financing';
import type { FinancingPaymentInput } from '@shared/interfaces/types/financing.types';
export class FinancingController extends BaseHandler {
  private service = new FinancingService();
  private user() { const id = FinanceAuthService.getInstance().getCurrentUserId(); if (!id) throw new Error('Usuário não autenticado'); return id; }
  @IpcMethod('financing:list') list(search?: string, page?: number) { return wrap(() => this.service.list(this.user(),search,page))(); }
  @IpcMethod('financing:create') create(input: FinancingInput) { return wrap(() => this.service.create(this.user(),input))(); }
  @IpcMethod('financing:detail') detail(id: number,page?: number) { return wrap(() => this.service.detail(this.user(),id,page))(); }
  @IpcMethod('financing:pay') pay(input: FinancingPaymentInput) { return wrap(() => this.service.pay(this.user(),input))(); }
  @IpcMethod('financing:reverse') reverse(id: number) { return wrap(() => this.service.reverse(this.user(),id))(); }
  @IpcMethod('financing:adjust') adjust(id: number,total: number,reason: string) { return wrap(() => this.service.adjust(this.user(),id,total,reason))(); }
}
