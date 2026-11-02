import { InvestmentService } from '../services/investment-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
import type {
  InvestmentInput,
  InvestmentEventInput,
} from '@shared/interfaces/types/investment.types';
export class InvestmentController extends BaseHandler {
  private readonly service = new InvestmentService();
  private userId(): number {
    const id = FinanceAuthService.getInstance().getCurrentUserId();
    if (!id) throw new Error('Usuário não autenticado');
    return id;
  }
  @IpcMethod('investment:event') async event(input: InvestmentEventInput) {
    return wrap(() => this.service.event(this.userId(), input))();
  }
  @IpcMethod('investment:list') async list() {
    return wrap(() => this.service.list(this.userId()))();
  }
  @IpcMethod('investment:create') async create(input: InvestmentInput) {
    return wrap(() => this.service.create(this.userId(), input))();
  }
  @IpcMethod('investment:recordYield') async recordYield(
    id: number,
    month: string,
    amount: number,
  ) {
    return wrap(() => this.service.record(this.userId(), id, month, amount))();
  }
  @IpcMethod('investment:remove') async remove(id: number) {
    return wrap(() => this.service.remove(this.userId(), id))();
  }
}
