import { getDataSource } from '@main/infrastructure/database/data-source';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { financingSchedule } from '@shared/finance/financing';
import type { FinancingInput } from '@shared/finance/financing';
import { assertCents } from '@shared/finance/investments';
import { calendarDate } from '@shared/finance/advanced-reports';
import type {
  FinancingContract,
  FinancingDetail,
  FinancingPaymentInput,
} from '@shared/interfaces/types/financing.types';

export class FinancingService {
  private page(page: number) {
    if (!Number.isInteger(page) || page < 0 || page > 100000)
      throw new Error('Página inválida');
    return page * 24;
  }
  private select = `SELECT f.id,f.name,f.creditor,f.method,f.principal_cents principalCents,f.status,
    CASE WHEN f.principal_cents>0 THEN f.principal_cents-COALESCE((SELECT SUM(p.principal_cents) FROM financing_payments p JOIN financing_installments i ON i.id=p.installment_id WHERE i.contract_id=f.id AND p.reversed=0),0) ELSE NULL END outstandingCents,
    (SELECT MIN(i.due_date) FROM financing_installments i WHERE i.contract_id=f.id AND i.total_cents>COALESCE((SELECT SUM(p.amount_cents) FROM financing_payments p WHERE p.installment_id=i.id AND p.reversed=0),0)) nextDueDate FROM financing_contracts f`;
  async list(
    userId: number,
    search = '',
    page = 0,
  ): Promise<{ contracts: FinancingContract[]; total: number }> {
    if (typeof search !== 'string' || search.length > 120)
      throw new Error('Busca inválida');
    const db = getDataSource(),
      args = [userId, `%${search}%`];
    const contracts = await db.query(
      this.select +
        ' WHERE f.user_id=? AND f.name LIKE ? ORDER BY f.id DESC LIMIT 24 OFFSET ?',
      [...args, this.page(page)],
    );
    const [count] = await db.query(
      'SELECT COUNT(*) total FROM financing_contracts f WHERE f.user_id=? AND f.name LIKE ?',
      args,
    );
    return { contracts, total: count.total };
  }
  async create(userId: number, input: FinancingInput): Promise<number> {
    const rows = financingSchedule(input);
    return financialTransaction(async (m) => {
      const [account] = await m.query(
        "SELECT id FROM accounts WHERE id=? AND user_id=? AND type<>'credit_card'",
        [input.accountId, userId],
      );
      const [category] = await m.query(
        "SELECT id FROM categories WHERE id=? AND (user_id=? OR (user_id IS NULL AND is_default=1)) AND type='expense'",
        [input.categoryId, userId],
      );
      if (!account || !category)
        throw new Error(
          'Selecione conta de caixa e categoria de despesa do perfil',
        );
      await m.query(
        'INSERT INTO financing_contracts(user_id,name,creditor,account_id,category_id,method,principal_cents,terms_json) VALUES(?,?,?,?,?,?,?,?)',
        [
          userId,
          input.name.trim(),
          input.creditor.trim(),
          input.accountId,
          input.categoryId,
          input.method,
          input.principalCents,
          JSON.stringify(input),
        ],
      );
      const [{ id }] = await m.query('SELECT last_insert_rowid() id');
      for (const row of rows)
        await m.query(
          'INSERT INTO financing_installments(contract_id,number,due_date,principal_cents,interest_cents,fees_cents,total_cents) VALUES(?,?,?,?,?,?,?)',
          [
            id,
            row.number,
            row.dueDate,
            row.principalCents,
            row.interestCents,
            row.feesCents,
            row.totalCents,
          ],
        );
      await m.query(
        'INSERT INTO financing_revisions(contract_id,reason) VALUES(?,?)',
        [id, 'Cadastro inicial; projeção não movimenta contas'],
      );
      return id;
    });
  }
  async detail(userId: number, id: number, page = 0): Promise<FinancingDetail> {
    const db = getDataSource();
    const [contract] = await db.query(
      this.select + ' WHERE f.user_id=? AND f.id=?',
      [userId, id],
    );
    if (!contract) throw new Error('Financiamento não encontrado');
    const installments = await db.query(
      'SELECT i.id,i.number,i.due_date dueDate,i.principal_cents principalCents,i.interest_cents interestCents,i.fees_cents feesCents,i.total_cents totalCents,COALESCE(SUM(CASE WHEN p.reversed=0 THEN p.amount_cents ELSE 0 END),0) paidCents FROM financing_installments i LEFT JOIN financing_payments p ON p.installment_id=i.id WHERE i.contract_id=? GROUP BY i.id ORDER BY i.number LIMIT 24 OFFSET ?',
      [id, this.page(page)],
    );
    const [{ total }] = await db.query(
      'SELECT COUNT(*) total FROM financing_installments WHERE contract_id=?',
      [id],
    );
    const payments = await db.query(
      'SELECT p.id,p.paid_at paidAt,p.amount_cents amountCents,p.principal_cents principalCents,p.reversed FROM financing_payments p JOIN financing_installments i ON i.id=p.installment_id WHERE i.contract_id=? AND p.user_id=? ORDER BY p.id DESC LIMIT 24 OFFSET ?',
      [id, userId, this.page(page)],
    );
    return { contract, installments, payments, total };
  }
  async pay(userId: number, input: FinancingPaymentInput): Promise<void> {
    assertCents(input.amountCents, true);
    assertCents(input.principalCents);
    if (input.principalCents < 0 || input.principalCents > input.amountCents)
      throw new Error('Principal incompatível');
    calendarDate(input.paidAt);
    if (
      typeof input.requestId !== 'string' ||
      !/^[\w-]{16,80}$/.test(input.requestId)
    )
      throw new Error('Chave de operação inválida');
    return financialTransaction(async (m) => {
      const [previous] = await m.query(
        'SELECT installment_id,amount_cents,principal_cents,paid_at FROM financing_payments WHERE user_id=? AND request_id=?',
        [userId, input.requestId],
      );
      if (previous) {
        if (
          previous.installment_id !== input.installmentId ||
          previous.amount_cents !== input.amountCents ||
          previous.principal_cents !== input.principalCents ||
          previous.paid_at !== input.paidAt
        )
          throw new Error('Chave já utilizada com outros valores');
        return;
      }
      const [row] = await m.query(
        'SELECT i.*,f.account_id,f.category_id,f.name,f.principal_cents contract_principal,f.id contract_id FROM financing_installments i JOIN financing_contracts f ON f.id=i.contract_id WHERE i.id=? AND f.user_id=?',
        [input.installmentId, userId],
      );
      if (!row) throw new Error('Parcela não encontrada');
      const [{ paid }] = await m.query(
        'SELECT COALESCE(SUM(amount_cents),0) paid FROM financing_payments WHERE installment_id=? AND reversed=0',
        [input.installmentId],
      );
      if (paid + input.amountCents > row.total_cents)
        throw new Error(
          'Pagamento supera parcela: ajuste o valor com justificativa antes de pagar',
        );
      const [{ principalPaid }] = await m.query(
        'SELECT COALESCE(SUM(p.principal_cents),0) principalPaid FROM financing_payments p JOIN financing_installments i ON i.id=p.installment_id WHERE i.contract_id=? AND p.reversed=0',
        [row.contract_id],
      );
      if (
        row.contract_principal > 0 &&
        principalPaid + input.principalCents > row.contract_principal
      )
        throw new Error('Amortização supera principal conhecido');
      const ids: (number | null)[] = [];
      for (const [amount, origin, label] of [
        [input.principalCents, 'transfer', 'Amortização'],
        [input.amountCents - input.principalCents, 'entry', 'Juros e encargos'],
      ] as const) {
        if (!amount) {
          ids.push(null);
          continue;
        }
        await m.query(
          "INSERT INTO transactions(description,amount,type,transaction_date,settlement_date,status,origin,account_id,category_id) VALUES(?,?,'expense',?,?,'settled',?,?,?)",
          [
            `${label}: ${row.name} · parcela ${row.number}`,
            amount,
            input.paidAt,
            input.paidAt,
            origin,
            row.account_id,
            row.category_id,
          ],
        );
        const [{ id }] = await m.query('SELECT last_insert_rowid() id');
        ids.push(id);
      }
      await m.query(
        'INSERT INTO financing_payments(installment_id,user_id,paid_at,amount_cents,principal_cents,principal_transaction_id,cost_transaction_id,request_id) VALUES(?,?,?,?,?,?,?,?)',
        [
          input.installmentId,
          userId,
          input.paidAt,
          input.amountCents,
          input.principalCents,
          ...ids,
          input.requestId,
        ],
      );
      await m.query(
        'UPDATE accounts SET balance=balance-? WHERE id=? AND user_id=?',
        [input.amountCents, row.account_id, userId],
      );
    });
  }
  async reverse(userId: number, id: number): Promise<void> {
    return financialTransaction(async (m) => {
      const [p] = await m.query(
        'SELECT p.*,f.account_id FROM financing_payments p JOIN financing_installments i ON i.id=p.installment_id JOIN financing_contracts f ON f.id=i.contract_id WHERE p.id=? AND p.user_id=? AND f.user_id=?',
        [id, userId, userId],
      );
      if (!p) throw new Error('Pagamento não encontrado');
      if (p.reversed) return;
      await m.query('UPDATE financing_payments SET reversed=1 WHERE id=?', [
        id,
      ]);
      await m.query(
        "UPDATE transactions SET status='cancelled' WHERE id IN (?,?)",
        [p.principal_transaction_id, p.cost_transaction_id],
      );
      await m.query(
        'UPDATE accounts SET balance=balance+? WHERE id=? AND user_id=?',
        [p.amount_cents, p.account_id, userId],
      );
    });
  }
  async adjust(
    userId: number,
    id: number,
    totalCents: number,
    reason: string,
  ): Promise<void> {
    assertCents(totalCents, true);
    if (
      typeof reason !== 'string' ||
      reason.trim().length < 5 ||
      reason.length > 500
    )
      throw new Error('Informe justificativa (5–500 caracteres)');
    return financialTransaction(async (m) => {
      const [row] = await m.query(
        'SELECT i.* FROM financing_installments i JOIN financing_contracts f ON f.id=i.contract_id WHERE i.id=? AND f.user_id=?',
        [id, userId],
      );
      if (!row) throw new Error('Parcela não encontrada');
      const [{ paid }] = await m.query(
        'SELECT COALESCE(SUM(amount_cents),0) paid FROM financing_payments WHERE installment_id=? AND reversed=0',
        [id],
      );
      if (paid > 0)
        throw new Error(
          'Parcela com pagamento não pode ser reprojetada; estorne primeiro',
        );
      await m.query(
        'INSERT INTO financing_revisions(contract_id,installment_id,old_total_cents,new_total_cents,reason) VALUES(?,?,?,?,?)',
        [row.contract_id, id, row.total_cents, totalCents, reason.trim()],
      );
      await m.query(
        'UPDATE financing_installments SET total_cents=? WHERE id=?',
        [totalCents, id],
      );
    });
  }
}
