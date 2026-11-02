import type { ApiResponse } from './common.types';
export interface InvestmentInput {
  name: string;
  kind: string;
  principalCents: number;
  startMonth: string;
  monthlyRate: number;
  accountId?: number;
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
  events?: InvestmentEvent[];
}
export interface InvestmentEvent {
  id: number;
  investmentId: number;
  accountId: number | null;
  kind: 'initial' | 'deposit' | 'withdrawal' | 'fee' | 'tax';
  amountCents: number;
  eventDate: string;
  requestId: string;
}
export interface InvestmentEventInput {
  investmentId: number;
  accountId?: number;
  kind: 'deposit' | 'withdrawal' | 'fee' | 'tax';
  amountCents: number;
  eventDate: string;
  requestId: string;
}
export interface InvestmentAPI {
  event(input: InvestmentEventInput): Promise<ApiResponse<void>>;
  list(): Promise<ApiResponse<InvestmentPortfolio>>;
  create(input: InvestmentInput): Promise<ApiResponse<void>>;
  recordYield(
    id: number,
    month: string,
    amountCents: number,
  ): Promise<ApiResponse<void>>;
  remove(id: number): Promise<ApiResponse<void>>;
}
