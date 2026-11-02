import type { FinancingInput, FinancingInstallment } from '../../finance/financing';
import type { ApiResponse } from './common.types';
export interface FinancingContract { id: number; name: string; creditor: string; method: string; principalCents: number; outstandingCents: number | null; status: string; nextDueDate: string | null; }
export interface FinancingDetail {
  contract: FinancingContract;
  installments: (FinancingInstallment & { id: number; paidCents: number })[];
  payments: { id: number; paidAt: string; amountCents: number; principalCents: number; reversed: number }[];
  total: number;
}
export interface FinancingPaymentInput { installmentId: number; amountCents: number; principalCents: number; paidAt: string; requestId: string; }
export interface FinancingAPI {
  list(search?: string, page?: number): Promise<ApiResponse<{ contracts: FinancingContract[]; total: number }>>;
  create(input: FinancingInput): Promise<ApiResponse<number>>;
  detail(id: number, page?: number): Promise<ApiResponse<FinancingDetail>>;
  pay(input: FinancingPaymentInput): Promise<ApiResponse<void>>;
  reverse(paymentId: number): Promise<ApiResponse<void>>;
  adjust(installmentId: number, totalCents: number, reason: string): Promise<ApiResponse<void>>;
}
