import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { getDataSource } from '@main/infrastructure/database/data-source';
import {
  calendarDate,
  validateReportQuery,
  reportMonths,
  relativeVariation,
  predictNext,
} from '@shared/finance/advanced-reports';
import type {
  AdvancedReportQuery,
  AdvancedReportResult,
  ReportPanel,
  ReportRow,
} from '@shared/finance/advanced-reports';

/** One parameterized scope for every panel and export. Monetary aggregates remain cents. */
export class AdvancedReportV2Service {
  async reserveSources(userId: number): Promise<number[]> {
    const rows: { account_id: number }[] = await getDataSource().query(
      "SELECT s.account_id FROM emergency_fund_sources s JOIN accounts a ON a.id=s.account_id WHERE s.user_id=? AND a.user_id=? AND a.type<>'credit_card'",
      [userId, userId],
    );
    return rows.map((r) => r.account_id);
  }
  async configureReserve(userId: number, accountIds: number[]) {
    if (
      !Array.isArray(accountIds) ||
      accountIds.length > 200 ||
      accountIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
    )
      throw new Error('Fontes inválidas');
    return financialTransaction(async (m) => {
      for (const id of accountIds) {
        const [account] = await m.query(
          "SELECT id FROM accounts WHERE id=? AND user_id=? AND type<>'credit_card'",
          [id, userId],
        );
        if (!account) throw new Error('Conta de reserva inválida');
      }
      await m.query('DELETE FROM emergency_fund_sources WHERE user_id=?', [
        userId,
      ]);
      for (const id of new Set(accountIds))
        await m.query('INSERT INTO emergency_fund_sources VALUES(?,?)', [
          id,
          userId,
        ]);
    });
  }
  private scope(userId: number, query: AdvancedReportQuery) {
    const date =
      query.basis === 'settlement' ? 't.settlement_date' : 't.transaction_date';
    const args: (number | string)[] = [
      userId,
      query.startDate,
      query.endDateExclusive,
    ];
    let sql = ` FROM transactions t JOIN accounts a ON a.id=t.account_id JOIN categories c ON c.id=t.category_id WHERE a.user_id=? AND (c.user_id=a.user_id OR (c.user_id IS NULL AND c.is_default=1)) AND t.origin='entry' AND t.status${query.basis === 'settlement' ? "='settled'" : "<>'cancelled'"} AND ${date}>=? AND ${date}<?`;
    for (const [column, ids] of [
      ['t.account_id', query.accountIds],
      ['t.category_id', query.categoryIds],
    ] as const) {
      if (ids?.length) {
        sql += ` AND ${column} IN (${ids.map(() => '?').join(',')})`;
        args.push(...ids);
      }
    }
    return { sql, args, date };
  }
  async query(
    userId: number,
    panel: ReportPanel,
    input: AdvancedReportQuery,
  ): Promise<AdvancedReportResult> {
    if (!Number.isSafeInteger(userId) || userId <= 0)
      throw new Error('Usuário inválido');
    if (
      ![
        'health',
        'history',
        'categories',
        'comparison',
        'trends',
        'habits',
      ].includes(panel)
    )
      throw new Error('Painel inválido');
    const query = validateReportQuery(input),
      db = getDataSource(),
      scope = this.scope(userId, query);
    const result: AdvancedReportResult = {
      query,
      panel,
      rows: [],
      methodology: `${query.basis === 'settlement' ? 'Realizado pela data de liquidação' : 'Competência, incluindo pendências'}; período [${query.startDate}, ${query.endDateExclusive}). Transferências, aportes e pagamentos de fatura não são novos consumos. Valores arredondados em centavos.`,
    };
    if (panel === 'history' || panel === 'trends') {
      const data: {
        month: string;
        categoryId: number;
        label: string;
        type: string;
        total: number;
      }[] = await db.query(
        `SELECT substr(${scope.date},1,7) month,t.category_id categoryId,c.name label,t.type type,SUM(t.amount) total${scope.sql} GROUP BY month,t.category_id,c.name,t.type ORDER BY month`,
        scope.args,
      );
      const months = reportMonths(query);
      if (panel === 'history')
        result.rows = months.map((month) => ({
          label: month,
          incomeCents: data
            .filter((r) => r.month === month && r.type === 'income')
            .reduce((s, r) => s + r.total, 0),
          expenseCents: data
            .filter((r) => r.month === month && r.type === 'expense')
            .reduce((s, r) => s + r.total, 0),
        }));
      else
        result.rows = [
          ...new Set(
            data.filter((r) => r.type === 'expense').map((r) => r.categoryId),
          ),
        ].map((id) => {
          const category = data.filter(
            (r) => r.categoryId === id && r.type === 'expense',
          );
          const points = months.map((month) => ({
            month,
            amountCents: category.find((r) => r.month === month)?.total ?? 0,
          }));
          return {
            categoryId: id,
            label: category[0].label,
            points,
            averageCents: Math.round(
              points.reduce((s, p) => s + p.amountCents, 0) / points.length,
            ),
            predictedCents: predictNext(points.map((p) => p.amountCents)),
          };
        });
      result.methodology +=
        ' Meses sem movimento são zero. Tendência linear hipotética; mínimo de três meses com movimento; não representa garantia.';
    } else if (panel === 'categories' || panel === 'comparison') {
      const aggregate = async (
        q: AdvancedReportQuery,
      ): Promise<(ReportRow & { id: number })[]> => {
        const s = this.scope(userId, q);
        return db.query(
          `SELECT c.id id,c.name label,SUM(t.amount) totalCents,COUNT(*) count${s.sql} AND t.type='expense' GROUP BY c.id,c.name ORDER BY totalCents DESC,c.id`,
          s.args,
        );
      };
      const current = await aggregate(query);
      if (panel === 'categories') {
        const total = current.reduce((s, r) => s + r.totalCents!, 0);
        result.rows = current.map((r) => ({
          ...r,
          categoryId: r.id,
          percentage: total ? (r.totalCents! / total) * 100 : 0,
          averageCents: Math.round(r.totalCents! / r.count!),
        }));
      } else {
        const previousDate = (value: string) => {
          const year = +value.slice(0, 4) - 1,
            suffix = value.slice(4);
          return calendarDate(
            `${year}${suffix === '-02-29' ? '-02-28' : suffix}`,
          );
        };
        const previous = await aggregate({
          ...query,
          startDate: previousDate(query.startDate),
          endDateExclusive: previousDate(query.endDateExclusive),
        });
        result.rows = [
          ...new Set([...current, ...previous].map((r) => r.id)),
        ].map((id) => {
          const a = current.find((r) => r.id === id),
            b = previous.find((r) => r.id === id),
            total = a?.totalCents ?? 0,
            before = b?.totalCents ?? 0;
          return {
            categoryId: id,
            label: (a ?? b)!.label,
            totalCents: total,
            previousCents: before,
            differenceCents: total - before,
            variationPercent: relativeVariation(total, before),
          };
        });
        result.methodology +=
          ' Comparação com as mesmas datas no ano anterior; 29/02 ajustado para 28/02.';
      }
    } else if (panel === 'habits') {
      const data: { day: number; totalCents: number; count: number }[] =
        await db.query(
          `SELECT CAST(strftime('%w',${scope.date}) AS INTEGER) day,SUM(t.amount) totalCents,COUNT(*) count${scope.sql} AND t.type='expense' GROUP BY day ORDER BY day`,
          scope.args,
        );
      result.rows = [
        'Domingo',
        'Segunda',
        'Terça',
        'Quarta',
        'Quinta',
        'Sexta',
        'Sábado',
      ].map((label, day) => {
        const r = data.find((r) => r.day === day);
        return {
          label,
          totalCents: r?.totalCents ?? 0,
          count: r?.count ?? 0,
          averageCents: r ? Math.round(r.totalCents / r.count) : 0,
        };
      });
      result.methodology += ' Média por transação, não média por dia.';
    } else {
      const data: {
        type: string;
        total: number;
        count: number;
        month: string;
      }[] = await db.query(
        `SELECT t.type type,SUM(t.amount) total,COUNT(*) count,substr(${scope.date},1,7) month${scope.sql} GROUP BY t.type,month`,
        scope.args,
      );
      const income = data
          .filter((r) => r.type === 'income')
          .reduce((s, r) => s + r.total, 0),
        expense = data
          .filter((r) => r.type === 'expense')
          .reduce((s, r) => s + r.total, 0);
      const now = new Date(),
        currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const complete = reportMonths(query).filter(
        (m) =>
          m + '-01' >= query.startDate &&
          m < currentMonth &&
          (() => {
            const [y, n] = m.split('-').map(Number);
            return (
              `${y + (n === 12 ? 1 : 0)}-${String(n === 12 ? 1 : n + 1).padStart(2, '0')}-01` <=
              query.endDateExclusive
            );
          })(),
      );
      const covered = complete.filter((m) => data.some((r) => r.month === m));
      // Budgets are monthly/category-wide. Never evaluate them against an account subset.
      const budgets: { planned: number; spent: number }[] = query.accountIds
        ?.length
        ? []
        : await db.query(
            `SELECT b.planned_amount planned,COALESCE(SUM(t.amount),0) spent FROM budgets b LEFT JOIN transactions t ON t.category_id=b.category_id AND t.type='expense' AND t.origin='entry' AND ${query.basis === 'settlement' ? "t.status='settled'" : "t.status<>'cancelled'"} AND substr(${scope.date},1,7)=printf('%04d-%02d',b.year,b.month) AND ${scope.date}>=? AND ${scope.date}<? AND t.account_id IN (SELECT id FROM accounts WHERE user_id=?) WHERE b.user_id=? AND printf('%04d-%02d-01',b.year,b.month)>=? AND date(printf('%04d-%02d-01',b.year,b.month),'+1 month')<=? ${query.categoryIds?.length ? `AND b.category_id IN (${query.categoryIds.map(() => '?').join(',')})` : ''} GROUP BY b.id`,
            [
              query.startDate,
              query.endDateExclusive,
              userId,
              userId,
              query.startDate,
              query.endDateExclusive,
              ...(query.categoryIds ?? []),
            ],
          );
      const planned = budgets.reduce((s, r) => s + r.planned, 0),
        excess = budgets.reduce(
          (s, r) => s + Math.max(0, r.spent - r.planned),
          0,
        );
      const adherence =
        planned > 0 ? Math.max(0, 100 * (1 - excess / planned)) : null;
      const savings = income > 0 ? ((income - expense) / income) * 100 : null;
      const sources = await this.reserveSources(userId);
      const reserveRows: { balance: number }[] = sources.length
        ? await db.query(
            "SELECT COALESCE(SUM(MAX(0,a.balance)),0) balance FROM accounts a JOIN emergency_fund_sources s ON s.account_id=a.id WHERE s.user_id=? AND a.user_id=? AND a.type<>'credit_card'",
            [userId, userId],
          )
        : [];
      const representativeExpense = data
        .filter((r) => r.type === 'expense' && complete.includes(r.month))
        .reduce((sum, r) => sum + r.total, 0);
      const reserveMonths =
        sources.length &&
        !query.accountIds?.length &&
        !query.categoryIds?.length &&
        complete.length >= 3 &&
        representativeExpense > 0
          ? reserveRows[0].balance / (representativeExpense / complete.length)
          : null;
      const recommendations: string[] = [];
      if (covered.length < 3)
        recommendations.push(
          'Amostra insuficiente para score: são necessários três meses completos com movimentos.',
        );
      if (adherence === null)
        recommendations.push(
          'Orçamento não configurado para este período ou não comparável aos filtros selecionados.',
        );
      if (excess > 0)
        recommendations.push(
          `Os orçamentos completos do período apresentam excesso de R$ ${(excess / 100).toFixed(2)}.`,
        );
      if (savings !== null && savings < 0)
        recommendations.push(
          'As despesas superam as receitas no período selecionado. Consulte os lançamentos.',
        );
      result.health = {
        score:
          covered.length >= 3 && savings !== null
            ? Math.round(
                (Math.max(0, Math.min(100, (savings / 20) * 100)) * 0.75 +
                  (adherence ?? 0) * (adherence === null ? 0 : 0.25)) /
                  (adherence === null ? 0.75 : 1),
              )
            : null,
        savingsRate: savings,
        expenseToIncomeRatio: income > 0 ? (expense / income) * 100 : null,
        budgetAdherence: adherence,
        emergencyFundMonths: reserveMonths,
        sampleSize: data.reduce((s, r) => s + r.count, 0),
        completeMonths: covered.length,
        budgetExcessCents: excess,
        recommendations,
      };
      result.rows = [
        {
          label: 'Período selecionado',
          incomeCents: income,
          expenseCents: expense,
        },
      ];
      result.methodology +=
        ' Score heurístico: poupança (75%) e aderência contínua (25%), normalizados nas dimensões disponíveis. Reserva usa somente contas explicitamente selecionadas, sem cartões, com média de despesas de meses completos e pelo menos três meses; filtros por conta/categoria tornam a dimensão não comparável. Orçamentos: somente meses completos, sem filtro por conta.';
    }
    return result;
  }
}
