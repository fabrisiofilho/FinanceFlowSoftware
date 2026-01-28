import { IFinanceAuthController } from '@shared/interfaces/controllers/finance-auth.controller.interface';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  RegisterInput,
  UpdateProfileInput,
  FinanceUser,
  FinanceAuthData,
} from '@shared/interfaces/types/finance-auth.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class FinanceAuthController
  extends BaseHandler
  implements IFinanceAuthController
{
  private financeAuthService = FinanceAuthService.getInstance();
  @IpcMethod('financeAuth:register')
  async register(data: RegisterInput): Promise<ApiResponse<FinanceUser>> {
    return wrap(async () => await this.financeAuthService.register(data))();
  }
  @IpcMethod('financeAuth:login')
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<FinanceAuthData>> {
    return wrap(
      async () => await this.financeAuthService.login(email, password),
    )();
  }
  @IpcMethod('financeAuth:logout')
  async logout(): Promise<ApiResponse<void>> {
    return wrap(async () => await this.financeAuthService.logout())();
  }
  @IpcMethod('financeAuth:checkAuth')
  async checkAuth(): Promise<ApiResponse<boolean>> {
    return wrap(async () => this.financeAuthService.isAuthenticated())();
  }
  @IpcMethod('financeAuth:getCurrentUser')
  async getCurrentUser(): Promise<ApiResponse<FinanceUser>> {
    return wrap(async () => {
      const user = this.financeAuthService.getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      return user;
    })();
  }
  @IpcMethod('financeAuth:updateProfile')
  async updateProfile(
    data: UpdateProfileInput,
  ): Promise<ApiResponse<FinanceUser>> {
    return wrap(
      async () => await this.financeAuthService.updateProfile(data),
    )();
  }
  @IpcMethod('financeAuth:changePassword')
  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<void>> {
    return wrap(
      async () =>
        await this.financeAuthService.changePassword(oldPassword, newPassword),
    )();
  }
}
