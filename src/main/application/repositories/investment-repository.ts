import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { getDataSource } from '@main/infrastructure/database/data-source';
import type {
  Investment,
  InvestmentInput,
  InvestmentYield,
  InvestmentEvent,
  InvestmentEventInput,
  InvestmentQuery,
  InvestmentPage,
} from '@shared/interfaces/types/investment.types';
export class InvestmentRepository {
  async query(userId: number, input: InvestmentQuery): Promise<InvestmentPage> {
    const page = input.page ?? 0,
      size = input.size ?? 24;
    if (
      !Number.isSafeInteger(page) ||
      page < 0 ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    )
      throw new Error('Paginação inválida.');
    if (
      input.kinds &&
      (!Array.isArray(input.kinds) ||
        input.kinds.length > 50 ||
        input.kinds.some(
          (kind) => typeof kind !== 'string' || kind.length > 80,
        ))
    )
      throw new Error('Tipos inválidos.');
    let where = 'user_id=?';
    const params: unknown[] = [userId];
    if (input.search?.trim()) {
      where += " AND name LIKE ? ESCAPE '\\'";
      params.push(
        '%' +
          input.search
            .trim()
            .slice(0, 200)
            .replace(/[\\%_]/g, (char) => '\\' + char) +
          '%',
      );
    }
    if (input.kinds?.length) {
      where += ` AND kind IN (${input.kinds.map(() => '?').join(',')})`;
      params.push(...input.kinds);
    }
    const db = getDataSource();
    const investments: Investment[] = await db.query(
      `SELECT id,user_id AS userId,name,kind,principal_cents AS principalCents,start_month AS startMonth,monthly_rate AS monthlyRate FROM investments WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, size, page * size],
    );
    const ids = investments.map((item) => item.id),
      placeholders = ids.map(() => '?').join(',');
    const yields: InvestmentYield[] = ids.length
      ? await db.query(
          `SELECT id,investment_id AS investmentId,month,amount_cents AS amountCents FROM investment_yields WHERE investment_id IN (${placeholders}) ORDER BY month DESC`,
          ids,
        )
      : [];
    const events: InvestmentEvent[] = ids.length
      ? await db.query(
          `SELECT id,investment_id AS investmentId,account_id AS accountId,kind,amount_cents AS amountCents,event_date AS eventDate,request_id AS requestId FROM investment_events WHERE user_id=? AND investment_id IN (${placeholders}) ORDER BY event_date DESC,id DESC`,
          [userId, ...ids],
        )
      : [];
    const [count] = await db.query(
      `SELECT COUNT(*) AS n FROM investments WHERE ${where}`,
      params,
    );
    const [summary] = await db.query(
      `SELECT COALESCE((SELECT SUM(principal_cents) FROM investments WHERE user_id=?),0) AS principalCents,COALESCE((SELECT SUM(y.amount_cents) FROM investment_yields y JOIN investments i ON i.id=y.investment_id WHERE i.user_id=?),0) AS yieldCents,COALESCE((SELECT SUM(CASE WHEN kind='initial' THEN 0 WHEN kind='deposit' THEN amount_cents ELSE -amount_cents END) FROM investment_events WHERE user_id=?),0) AS eventsCents`,
      [userId, userId, userId],
    );
    return {
      investments,
      yields,
      events,
      page,
      totalElements: count.n,
      totalPages: Math.ceil(count.n / size),
      summary: {
        principalCents: summary.principalCents,
        yieldCents: summary.yieldCents,
        balanceCents:
          summary.principalCents + summary.yieldCents + summary.eventsCents,
      },
    };
  }
  async list(userId: number): Promise<Investment[]> {
    return getDataSource().query(
      'SELECT id,user_id AS userId,name,kind,principal_cents AS principalCents,start_month AS startMonth,monthly_rate AS monthlyRate FROM investments WHERE user_id=? ORDER BY id DESC',
      [userId],
    );
  }
  async yields(userId: number): Promise<InvestmentYield[]> {
    return getDataSource().query(
      'SELECT y.id,y.investment_id AS investmentId,y.month,y.amount_cents AS amountCents FROM investment_yields y JOIN investments i ON i.id=y.investment_id WHERE i.user_id=? ORDER BY y.month DESC',
      [userId],
    );
  }
  async events(userId: number): Promise<InvestmentEvent[]> {
    return getDataSource().query(
      'SELECT id,investment_id AS investmentId,account_id AS accountId,kind,amount_cents AS amountCents,event_date AS eventDate,request_id AS requestId FROM investment_events WHERE user_id=? ORDER BY event_date DESC,id DESC',
      [userId],
    );
  }
  async create(userId: number, input: InvestmentInput): Promise<void> {
    await financialTransaction(async (manager) => {
      if (input.accountId) {
        const [account] = await manager.query(
          "SELECT id FROM accounts WHERE id=? AND user_id=? AND type<>'credit_card' AND balance>=?",
          [input.accountId, userId, input.principalCents],
        );
        if (!account)
          throw new Error('Conta de origem inválida ou saldo insuficiente.');
        await manager.query(
          'UPDATE accounts SET balance=balance-? WHERE id=? AND user_id=?',
          [input.principalCents, input.accountId, userId],
        );
      }
      await manager.query(
        'INSERT INTO investments(user_id,name,kind,principal_cents,start_month,monthly_rate) VALUES(?,?,?,?,?,?)',
        [
          userId,
          input.name.trim(),
          input.kind.trim(),
          input.principalCents,
          input.startMonth,
          input.monthlyRate,
        ],
      );
      if (input.accountId) {
        const [row] = await manager.query('SELECT last_insert_rowid() AS id');
        await manager.query(
          "INSERT INTO investment_events(investment_id,user_id,account_id,kind,amount_cents,event_date,request_id) VALUES(?,?,?,'initial',?,?,?)",
          [
            row.id,
            userId,
            input.accountId,
            input.principalCents,
            input.startMonth + '-01',
            'initial:' + row.id,
          ],
        );
      }
    });
  }
  async event(userId: number, input: InvestmentEventInput): Promise<void> {
    await financialTransaction(async (manager) => {
      const previous = await manager.query(
        'SELECT investment_id,account_id,kind,amount_cents,event_date FROM investment_events WHERE user_id=? AND request_id=?',
        [userId, input.requestId],
      );
      if (previous.length) {
        const row = previous[0];
        if (
          row.investment_id !== input.investmentId ||
          row.kind !== input.kind ||
          row.amount_cents !== input.amountCents ||
          row.account_id !== (input.accountId ?? null) ||
          row.event_date !== input.eventDate
        )
          throw new Error('Identificador de operação já utilizado.');
        return;
      }
      const [holding] = await manager.query(
        "SELECT i.principal_cents+COALESCE((SELECT SUM(y.amount_cents) FROM investment_yields y WHERE y.investment_id=i.id),0)+COALESCE((SELECT SUM(CASE e.kind WHEN 'deposit' THEN e.amount_cents WHEN 'initial' THEN 0 ELSE -e.amount_cents END) FROM investment_events e WHERE e.investment_id=i.id),0) AS balance, i.start_month AS start FROM investments i WHERE i.id=? AND i.user_id=?",
        [input.investmentId, userId],
      );
      if (!holding) throw new Error('Investimento não encontrado.');
      if (
        !Number.isSafeInteger(holding.balance) ||
        !Number.isSafeInteger(
          holding.balance +
            (input.kind === 'deposit' ? input.amountCents : -input.amountCents),
        )
      )
        throw new Error('A operação excede o limite monetário.');
      if (input.eventDate.slice(0, 7) < holding.start)
        throw new Error('Data anterior ao início da aplicação.');
      if (input.kind !== 'deposit' && holding.balance < input.amountCents)
        throw new Error('Saldo insuficiente no investimento.');
      if (input.kind === 'deposit' || input.kind === 'withdrawal') {
        const [account] = await manager.query(
          "SELECT balance FROM accounts WHERE id=? AND user_id=? AND type<>'credit_card'",
          [input.accountId, userId],
        );
        if (!account) throw new Error('Selecione uma conta monetária válida.');
        if (input.kind === 'deposit' && account.balance < input.amountCents)
          throw new Error('Saldo insuficiente na conta.');
        const delta =
          input.kind === 'deposit' ? -input.amountCents : input.amountCents;
        if (
          !Number.isSafeInteger(account.balance) ||
          !Number.isSafeInteger(account.balance + delta)
        )
          throw new Error('Saldo fora do limite monetário.');
        await manager.query(
          'UPDATE accounts SET balance=balance+? WHERE id=? AND user_id=?',
          [delta, input.accountId, userId],
        );
      } else if (input.accountId)
        throw new Error(
          'Taxas e impostos são descontados da posição, sem conta de caixa.',
        );
      await manager.query(
        'INSERT INTO investment_events(investment_id,user_id,account_id,kind,amount_cents,event_date,request_id) VALUES(?,?,?,?,?,?,?)',
        [
          input.investmentId,
          userId,
          input.accountId ?? null,
          input.kind,
          input.amountCents,
          input.eventDate,
          input.requestId,
        ],
      );
    });
  }
  async record(id: number, month: string, amount: number): Promise<void> {
    await getDataSource().query(
      'INSERT INTO investment_yields(investment_id,month,amount_cents) VALUES(?,?,?) ON CONFLICT(investment_id,month) DO UPDATE SET amount_cents=excluded.amount_cents',
      [id, month, amount],
    );
  }
  async remove(userId: number, id: number): Promise<void> {
    await financialTransaction(async (manager) => {
      const [count] = await manager.query(
        'SELECT COUNT(*) AS count FROM investment_events WHERE investment_id=? AND user_id=?',
        [id, userId],
      );
      if (count.count > 0)
        throw new Error(
          'Investimento com movimentações não pode ser excluído. Preserve o histórico.',
        );
      await manager.query(
        'DELETE FROM investment_yields WHERE investment_id IN (SELECT id FROM investments WHERE user_id=? AND id=?)',
        [userId, id],
      );
      await manager.query('DELETE FROM investments WHERE user_id=? AND id=?', [
        userId,
        id,
      ]);
    });
  }
}
