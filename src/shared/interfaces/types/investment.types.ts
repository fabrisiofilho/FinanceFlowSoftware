import type { ApiResponse } from './common.types';
export interface InvestmentInput {
  name: string;
  kind: string;
  principalCents: number;
  startMonth: string;
  monthlyRate: number;
}
export interface Investment extends InvestmentInput {
  id: number;
  userId: number;
}
export interface InvestmentYield {
  id: number;
  investmentId: number;
  month: string;
  amountCents: number;
}
export interface InvestmentPortfolio {
  investments: Investment[];
  yields: InvestmentYield[];
}
export interface InvestmentAPI {
  list(): Promise<ApiResponse<InvestmentPortfolio>>;
  create(input: InvestmentInput): Promise<ApiResponse<void>>;
  recordYield(
    id: number,
    month: string,
    amountCents: number,
  ): Promise<ApiResponse<void>>;
  remove(id: number): Promise<ApiResponse<void>>;
}
