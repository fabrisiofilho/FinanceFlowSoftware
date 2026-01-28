export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
export interface UpdateProfileInput {
  name?: string;
  email?: string;
}
export interface FinanceUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
export interface FinanceAuthData {
  user: FinanceUser;
  isAuthenticated: boolean;
}
export interface FinanceLoginCredentials {
  email: string;
  password: string;
}
export type LoginCredentials = FinanceLoginCredentials;
export type RegisterCredentials = RegisterInput;
