import { IAccountController } from '@shared/interfaces/controllers/account.controller.interface';
import { AccountService } from '../services/account-service';
import { BalanceCalculatorService } from '../services/balance-calculator-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '@shared/interfaces/types/account.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class AccountController
  extends BaseHandler
  implements IAccountController
{
  private _accountService: AccountService | null = null;
  private _balanceCalculatorService: BalanceCalculatorService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get accountService(): AccountService {
    if (!this._accountService) {
      this._accountService = new AccountService();
    }
    return this._accountService;
  }
  private get balanceCalculatorService(): BalanceCalculatorService {
    if (!this._balanceCalculatorService) {
      this._balanceCalculatorService = new BalanceCalculatorService();
    }
    return this._balanceCalculatorService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('account:create')
  async create(data: CreateAccountInput): Promise<ApiResponse<Account>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.accountService.create(userId, data);
    })();
  }
  @IpcMethod('account:update')
  async update(
    id: number,
    data: UpdateAccountInput,
  ): Promise<ApiResponse<Account>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.accountService.update(userId, id, data);
    })();
  }
  @IpcMethod('account:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.accountService.delete(userId, id);
    })();
  }
  @IpcMethod('account:findById')
  async findById(id: number): Promise<ApiResponse<Account>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const account = await this.accountService.findById(userId, id);
      if (!account) {
        throw new Error('Conta não encontrada');
      }
      return account;
    })();
  }
  @IpcMethod('account:findAll')
  async findAll(): Promise<ApiResponse<Account[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.accountService.findAll(userId);
    })();
  }
  @IpcMethod('account:getBalance')
  async getBalance(id: number): Promise<ApiResponse<number>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.accountService.getBalance(userId, id);
    })();
  }
  @IpcMethod('account:getTotalBalance')
  async getTotalBalance(): Promise<ApiResponse<number>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.accountService.getTotalBalance(userId);
    })();
  }

  @IpcMethod('account:recalculateBalance')
  async recalculateBalance(id: number): Promise<ApiResponse<number>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.balanceCalculatorService.recalculateAccountBalance(userId, id);
    })();
  }

  @IpcMethod('account:recalculateAllBalances')
  async recalculateAllBalances(): Promise<ApiResponse<{ [accountId: number]: number }>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const balances = await this.balanceCalculatorService.recalculateAllAccountBalances(userId);
      return Object.fromEntries(balances);
    })();
  }
}
