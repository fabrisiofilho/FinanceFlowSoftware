import { InvestmentRepository } from '../repositories/investment-repository';
import {
  assertCents,
  assertMonth,
  projectInvestment,
} from '@shared/finance/investments';
import type {
  InvestmentInput,
  InvestmentPortfolio,
} from '@shared/interfaces/types/investment.types';
export class InvestmentService {
  constructor(private readonly repository = new InvestmentRepository()) {}
  async list(userId: number): Promise<InvestmentPortfolio> {
    const [investments, yields] = await Promise.all([
      this.repository.list(userId),
      this.repository.yields(userId),
    ]);
    return { investments, yields };
  }
  async create(userId: number, input: InvestmentInput): Promise<void> {
    if (
      typeof input.name !== 'string' ||
      !input.name.trim() ||
      input.name.length > 120 ||
      typeof input.kind !== 'string' ||
      !input.kind.trim() ||
      input.kind.length > 80
    )
      throw new Error('Informe nome e tipo do investimento');
    assertCents(input.principalCents, true);
    assertMonth(input.startMonth);
    projectInvestment(input.principalCents, input.monthlyRate, 1);
    await this.repository.create(userId, input);
  }
  async record(
    userId: number,
    id: number,
    month: string,
    amount: number,
  ): Promise<void> {
    assertMonth(month);
    assertCents(amount);
    const investment = (await this.repository.list(userId)).find(
      (item) => item.id === id,
    );
    if (!investment) throw new Error('Investimento não encontrado');
    const now = new Date();
    const currentMonth =
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    if (month < investment.startMonth || month > currentMonth)
      throw new Error('Registre uma competência entre o início e o mês atual');
    const previous = (await this.repository.yields(userId))
      .filter((item) => item.investmentId === id && item.month !== month)
      .reduce((sum, item) => sum + item.amountCents, investment.principalCents);
    if (previous + amount < 0)
      throw new Error('O rendimento não pode deixar o saldo negativo');
    await this.repository.record(id, month, amount);
  }
  async remove(userId: number, id: number): Promise<void> {
    await this.repository.remove(userId, id);
  }
}
