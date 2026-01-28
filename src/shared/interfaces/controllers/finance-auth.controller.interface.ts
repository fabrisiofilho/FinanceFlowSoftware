import { ApiResponse } from '../types/common.types';
import {
  RegisterInput,
  UpdateProfileInput,
  FinanceUser,
  FinanceAuthData,
} from '../types/finance-auth.types';
export interface IFinanceAuthController {
  register(data: RegisterInput): Promise<ApiResponse<FinanceUser>>;
  login(email: string, password: string): Promise<ApiResponse<FinanceAuthData>>;
  logout(): Promise<ApiResponse<void>>;
  checkAuth(): Promise<ApiResponse<boolean>>;
  getCurrentUser(): Promise<ApiResponse<FinanceUser>>;
  updateProfile(data: UpdateProfileInput): Promise<ApiResponse<FinanceUser>>;
  changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<void>>;
}
