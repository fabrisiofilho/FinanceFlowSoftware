import {
  CreditCardInvoiceEntity,
  InvoiceStatus as EntityInvoiceStatus,
} from '../entities/credit-card-invoice.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  CreditCardInvoice,
  CreditCardSummary,
  InvoiceFilters,
  InvoiceStatus,
  InvoiceTransaction,
  PayInvoiceInput,
  PayInvoiceResult,
} from '@shared/interfaces/types/credit-card.types';
import { repositoryCache } from '../repositories/repository-cache';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
export class CreditCardService {
  constructor() {}
  private get invoiceRepository() {
    return repositoryCache.creditCardInvoiceRepository;
  }
  private get accountRepository() {
    return repositoryCache.accountRepository;
  }
  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }
  determineInvoiceMonth(
    transactionDate: Date,
    closingDay: number,
  ): { year: number; month: number } {
    const date = parseDateSafe(transactionDate) ?? new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;

    if (date.getDate() > closingDay) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return { year, month };
  }
  private calculateDueDate(
    year: number,
    month: number,
    closingDay: number,
  ): Date {
    const dueDay = closingDay + 10;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (dueDay > daysInMonth) {
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      return new Date(nextYear, nextMonth - 1, dueDay - daysInMonth);
    }
    return new Date(year, month - 1, dueDay);
  }
  private mapEntityToInvoice(
    entity: CreditCardInvoiceEntity,
  ): CreditCardInvoice {
    const transactions: InvoiceTransaction[] = (entity.transactions ?? [])
      .filter((t) => t.id !== undefined)
      .map((t) => ({
        id: t.id!,
        description: t.description ?? '',
        amount: Number(t.amount),
        type: t.type ?? 'expense',
        paymentMethod: t.paymentMethod,
        expenseType: t.expenseType,
        transactionDate: parseDateSafe(t.transactionDate) ?? new Date(),
        dueDate: t.dueDate ? parseDateSafe(t.dueDate) ?? undefined : undefined,
        installmentNumber: t.installmentNumber,
        totalInstallments: t.totalInstallments,
        installmentGroupId: t.installmentGroupId,
        recurrence: t.recurrence,
        accountId: t.accountId ?? 0,
        categoryId: t.categoryId ?? 0,
        creditCardInvoiceId: t.creditCardInvoiceId,
        categoryName: t.category?.name,
        categoryIcon: t.category?.icon,
        createdAt: t.createdAt ?? new Date(),
        updatedAt: t.updatedAt ?? new Date(),
      }));
    return {
      id: entity.id,
      accountId: entity.accountId,
      accountName: entity.account?.name,
      year: entity.year,
      month: entity.month,
      totalAmount: Number(entity.totalAmount),
      dueDate: parseDateSafe(entity.dueDate) ?? new Date(),
      status: entity.status as InvoiceStatus,
      paidAt: entity.paidAt ? parseDateSafe(entity.paidAt) ?? undefined : undefined,
      paymentAccountId: entity.paymentAccountId ?? undefined,
      paymentAccountName: entity.paymentAccount?.name,
      transactions,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
  async getOrCreateInvoice(
    userId: number,
    accountId: number,
    year: number,
    month: number,
  ): Promise<CreditCardInvoice> {
    logger.info(
      `Buscando ou criando fatura para ${month}/${year} do cartão ${accountId}`,
    );
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      throw new Error('A conta informada não é um cartão de crédito');
    }
    if (!account.closingDay) {
      throw new Error('Cartão de crédito sem dia de fechamento configurado');
    }
    const dueDate = this.calculateDueDate(year, month, account.closingDay);
    const invoiceEntity = await this.invoiceRepository.findOrCreate(
      accountId,
      year,
      month,
      dueDate,
    );
    logger.success(`Fatura ${month}/${year} obtida com sucesso`);
    return this.mapEntityToInvoice(invoiceEntity);
  }
  async linkTransactionToInvoice(
    userId: number,
    transactionId: number,
    invoiceId: number,
  ): Promise<CreditCardInvoice> {
    logger.info(`Vinculando transação ${transactionId} à fatura ${invoiceId}`);
    const transaction = await this.transactionRepository.findById(
      transactionId,
      userId,
    );
    if (!transaction) {
      throw new Error('Transação não encontrada');
    }
    const invoice = await this.invoiceRepository.findById(invoiceId, userId);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    if (invoice.status !== 'open') {
      throw new Error(
        'Não é possível vincular transações a uma fatura fechada ou paga',
      );
    }
    await this.transactionRepository.updateTransaction(transactionId, userId, {
      creditCardInvoiceId: invoiceId,
    });
    await this.invoiceRepository.recalculateTotalFromTransactions(invoiceId);
    const updatedInvoice = await this.invoiceRepository.findById(
      invoiceId,
      userId,
    );
    if (!updatedInvoice) {
      throw new Error('Erro ao atualizar fatura');
    }
    logger.success(`Transação vinculada à fatura com sucesso`);
    return this.mapEntityToInvoice(updatedInvoice);
  }
  async closeInvoice(
    userId: number,
    invoiceId: number,
  ): Promise<CreditCardInvoice> {
    logger.info(`Fechando fatura ${invoiceId}`);
    const invoice = await this.invoiceRepository.findById(invoiceId, userId);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    if (invoice.status !== 'open') {
      throw new Error('Esta fatura já está fechada ou paga');
    }
    await this.invoiceRepository.recalculateTotalFromTransactions(invoiceId);
    await this.invoiceRepository.closeInvoice(invoiceId);
    const closedInvoice = await this.invoiceRepository.findById(
      invoiceId,
      userId,
    );
    if (!closedInvoice) {
      throw new Error('Erro ao fechar fatura');
    }
    logger.success(
      `Fatura ${invoiceId} fechada com sucesso. Total: R$ ${Number(closedInvoice.totalAmount).toFixed(2)}`,
    );
    return this.mapEntityToInvoice(closedInvoice);
  }
  async payInvoice(
    userId: number,
    data: PayInvoiceInput,
  ): Promise<PayInvoiceResult> {
    logger.info(`Pagando fatura ${data.invoiceId}`);
    const invoice = await this.invoiceRepository.findById(
      data.invoiceId,
      userId,
    );
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    if (invoice.status === 'paid') {
      throw new Error('Esta fatura já foi paga');
    }
    const paymentAccount = await this.accountRepository.findById(
      data.paymentAccountId,
      userId,
    );
    if (!paymentAccount) {
      throw new Error('Conta de pagamento não encontrada');
    }
    if (paymentAccount.type === 'credit_card') {
      throw new Error(
        'Não é possível pagar uma fatura com outro cartão de crédito',
      );
    }
    const amountToPay = data.amount ?? Number(invoice.totalAmount);
    if (amountToPay <= 0) {
      throw new Error('Valor de pagamento deve ser maior que zero');
    }
    const currentBalance = Number(paymentAccount.balance);
    if (currentBalance < amountToPay) {
      throw new Error('Saldo insuficiente na conta de pagamento');
    }
    const newBalance = currentBalance - amountToPay;
    await this.accountRepository.updateBalance(
      data.paymentAccountId,
      userId,
      newBalance,
    );
    await this.invoiceRepository.markAsPaid(
      data.invoiceId,
      data.paymentAccountId,
    );
    const paidInvoice = await this.invoiceRepository.findById(
      data.invoiceId,
      userId,
    );
    if (!paidInvoice) {
      throw new Error('Erro ao atualizar fatura');
    }
    logger.success(
      `Fatura paga com sucesso. Valor: R$ ${amountToPay.toFixed(2)}. Novo saldo da conta: R$ ${newBalance.toFixed(2)}`,
    );
    return {
      invoice: this.mapEntityToInvoice(paidInvoice),
      amountPaid: amountToPay,
      paymentAccountBalance: newBalance,
    };
  }
  async distributeInstallments(
    userId: number,
    accountId: number,
    transactionId: number,
    totalInstallments: number,
  ): Promise<CreditCardInvoice[]> {
    logger.info(
      `Distribuindo ${totalInstallments} parcelas nas faturas do cartão ${accountId}`,
    );
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      throw new Error('A conta informada não é um cartão de crédito');
    }
    if (!account.closingDay) {
      throw new Error('Cartão de crédito sem dia de fechamento configurado');
    }
    const transaction = await this.transactionRepository.findById(
      transactionId,
      userId,
    );
    if (!transaction) {
      throw new Error('Transação não encontrada');
    }
    if (!transaction.installmentGroupId) {
      throw new Error('Transação não possui grupo de parcelas');
    }
    const installments =
      await this.transactionRepository.findByInstallmentGroup(
        transaction.installmentGroupId,
      );
    if (installments.length !== totalInstallments) {
      logger.warning(
        `Número de parcelas encontradas (${installments.length}) difere do esperado (${totalInstallments})`,
      );
    }
    const affectedInvoices: CreditCardInvoice[] = [];
    for (const installment of installments) {
      const { year, month } = this.determineInvoiceMonth(
        parseDateSafe(installment.transactionDate) ?? new Date(),
        account.closingDay,
      );
      const invoice = await this.getOrCreateInvoice(
        userId,
        accountId,
        year,
        month,
      );
      await this.linkTransactionToInvoice(userId, installment.id, invoice.id);
      if (!affectedInvoices.find((i) => i.id === invoice.id)) {
        const updatedInvoice = await this.invoiceRepository.findById(
          invoice.id,
          userId,
        );
        if (updatedInvoice) {
          affectedInvoices.push(this.mapEntityToInvoice(updatedInvoice));
        }
      }
    }
    logger.success(
      `Parcelas distribuídas em ${affectedInvoices.length} faturas`,
    );
    return affectedInvoices;
  }
  async getInvoices(
    userId: number,
    filters?: InvoiceFilters,
  ): Promise<CreditCardInvoice[]> {
    logger.info('Listando faturas do usuário:', userId);
    let invoices: CreditCardInvoiceEntity[];
    if (filters?.accountId) {
      const account = await this.accountRepository.findById(
        filters.accountId,
        userId,
      );
      if (!account) {
        throw new Error('Conta não encontrada');
      }
      invoices = await this.invoiceRepository.findByAccount(filters.accountId);
    } else if (filters?.status) {
      const entityStatus = filters.status as EntityInvoiceStatus;
      if (
        entityStatus === 'open' ||
        entityStatus === 'closed' ||
        entityStatus === 'paid'
      ) {
        invoices = await this.invoiceRepository.findByStatus(
          userId,
          entityStatus,
        );
      } else {
        invoices = await this.invoiceRepository.findAllByUserId(userId);
      }
    } else {
      invoices = await this.invoiceRepository.findAllByUserId(userId);
    }
    if (filters?.year) {
      invoices = invoices.filter((i) => i.year === filters.year);
    }
    if (filters?.month) {
      invoices = invoices.filter((i) => i.month === filters.month);
    }
    return invoices.map((entity) => this.mapEntityToInvoice(entity));
  }
  async getInvoiceDetails(
    userId: number,
    invoiceId: number,
  ): Promise<CreditCardInvoice> {
    logger.info(`Buscando detalhes da fatura ${invoiceId}`);
    const invoice = await this.invoiceRepository.findById(invoiceId, userId);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    return this.mapEntityToInvoice(invoice);
  }
  async getCreditCardSummary(
    userId: number,
    accountId: number,
  ): Promise<CreditCardSummary> {
    logger.info(`Obtendo resumo do cartão ${accountId}`);
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      throw new Error('A conta informada não é um cartão de crédito');
    }
    const creditLimit = Number(account.creditLimit) || 0;
    const closingDay = account.closingDay || 1;
    const openInvoices = await this.invoiceRepository.findByStatus(
      userId,
      'open',
    );
    const closedInvoices = await this.invoiceRepository.findByStatus(
      userId,
      'closed',
    );
    const cardOpenInvoices = openInvoices.filter(
      (i) => i.accountId === accountId,
    );
    const cardClosedInvoices = closedInvoices.filter(
      (i) => i.accountId === accountId,
    );
    const usedLimit =
      cardOpenInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0) +
      cardClosedInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const availableLimit = Math.max(0, creditLimit - usedLimit);
    const usedPercentage =
      creditLimit > 0 ? (usedLimit / creditLimit) * 100 : 0;
    const currentInvoice = await this.invoiceRepository.getCurrentInvoice(
      accountId,
      closingDay,
    );
    const nextDueInvoice =
      cardClosedInvoices.length > 0
        ? cardClosedInvoices.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          })[0]
        : undefined;
    return {
      accountId,
      accountName: account.name,
      creditLimit,
      usedLimit,
      availableLimit,
      usedPercentage,
      closingDay,
      cardColor: account.cardColor ?? undefined,
      cardBrand: account.cardBrand ?? undefined,
      bankName: account.bankName ?? undefined,
      currentInvoice: currentInvoice
        ? this.mapEntityToInvoice(currentInvoice)
        : undefined,
      nextDueInvoice: nextDueInvoice
        ? this.mapEntityToInvoice(nextDueInvoice)
        : undefined,
    };
  }
  async getCreditCardsSummary(userId: number): Promise<CreditCardSummary[]> {
    logger.info('Obtendo resumo de todos os cartões do usuário:', userId);
    const creditCards = await this.accountRepository.findCreditCards(userId);
    const summaries: CreditCardSummary[] = [];
    for (const card of creditCards) {
      const summary = await this.getCreditCardSummary(userId, card.id);
      summaries.push(summary);
    }
    return summaries;
  }
  async autoLinkTransactionToInvoice(
    userId: number,
    transactionId: number,
    accountId: number,
    transactionDate: Date,
  ): Promise<CreditCardInvoice> {
    logger.info(
      `Vinculando automaticamente transação ${transactionId} à fatura correta`,
    );
    const account = await this.accountRepository.findById(accountId, userId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }
    if (account.type !== 'credit_card') {
      throw new Error('A conta informada não é um cartão de crédito');
    }
    if (!account.closingDay) {
      throw new Error('Cartão de crédito sem dia de fechamento configurado');
    }
    const { year, month } = this.determineInvoiceMonth(
      transactionDate,
      account.closingDay,
    );
    const invoice = await this.getOrCreateInvoice(
      userId,
      accountId,
      year,
      month,
    );
    return await this.linkTransactionToInvoice(
      userId,
      transactionId,
      invoice.id,
    );
  }
}
