import { parseCalendarDate } from '@shared/finance/calendar-date';
import { InvestmentRepository } from '../repositories/investment-repository';
import {
  assertCents,
  assertMonth,
  projectInvestment,
} from '@shared/finance/investments';
import type {
  InvestmentInput,
  InvestmentPortfolio,
  InvestmentEventInput,
  InvestmentQuery,
  InvestmentPage,
} from '@shared/interfaces/types/investment.types';
export class InvestmentService {
  async query(userId: number, input: InvestmentQuery): Promise<InvestmentPage> {
    return this.repository.query(userId, input);
  }
  constructor(private readonly repository = new InvestmentRepository()) {}
  async list(userId: number): Promise<InvestmentPortfolio> {
    const [investments, yields, events] = await Promise.all([
      this.repository.list(userId),
      this.repository.yields(userId),
      this.repository.events(userId),
    ]);
    return { investments, yields, events };
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
    if (
      input.accountId !== undefined &&
      (!Number.isSafeInteger(input.accountId) || input.accountId <= 0)
    )
      throw new Error('Conta inválida.');
    if (
      input.startMonth >
      new Date().getFullYear() +
        '-' +
        String(new Date().getMonth() + 1).padStart(2, '0')
    )
      throw new Error('Início não pode estar no futuro.');
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
    const events = (await this.repository.events(userId))
      .filter((event) => event.investmentId === id)
      .reduce(
        (sum, event) =>
          sum +
          (event.kind === 'initial'
            ? 0
            : event.kind === 'deposit'
              ? event.amountCents
              : -event.amountCents),
        0,
      );
    const previous = (await this.repository.yields(userId))
      .filter((item) => item.investmentId === id && item.month !== month)
      .reduce((sum, item) => sum + item.amountCents, investment.principalCents);
    if (previous + events + amount < 0)
      throw new Error('O rendimento não pode deixar o saldo negativo');
    await this.repository.record(id, month, amount);
  }
  async event(userId: number, input: InvestmentEventInput): Promise<void> {
    if (!Number.isSafeInteger(input.investmentId) || input.investmentId <= 0)
      throw new Error('Investimento inválido.');
    if (!['deposit', 'withdrawal', 'fee', 'tax'].includes(input.kind))
      throw new Error('Operação inválida.');
    assertCents(input.amountCents, true);
    const date = parseCalendarDate(input.eventDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (!date || date > today)
      throw new Error('Informe data válida, até hoje.');
    if (
      typeof input.requestId !== 'string' ||
      !input.requestId.trim() ||
      input.requestId.length > 100
    )
      throw new Error('Identificador inválido.');
    await this.repository.event(userId, input);
  }
  async remove(userId: number, id: number): Promise<void> {
    await this.repository.remove(userId, id);
  }
}
