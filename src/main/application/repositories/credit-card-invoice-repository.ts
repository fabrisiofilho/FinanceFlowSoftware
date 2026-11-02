import { BaseRepository } from './base-repository';
import {
  CreditCardInvoiceEntity,
  InvoiceStatus,
} from '../entities/credit-card-invoice.entity';
import { EntityManager } from 'typeorm';
export class CreditCardInvoiceRepository extends BaseRepository<CreditCardInvoiceEntity> {
  constructor(manager?: EntityManager) {
    super(CreditCardInvoiceEntity, manager);
  }
  async findById(
    id: number,
    userId: number,
  ): Promise<CreditCardInvoiceEntity | null> {
    return await this.findOne({
      where: { id, account: { userId } },
      relations: ['account', 'transactions', 'paymentAccount'],
    });
  }
  async findAllByUserId(userId: number): Promise<CreditCardInvoiceEntity[]> {
    return await this.find({
      where: { account: { userId } },
      relations: ['account', 'transactions'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }
  async findByAccount(accountId: number): Promise<CreditCardInvoiceEntity[]> {
    return await this.find({
      where: { accountId },
      relations: ['account', 'transactions'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }
  async findByMonthYear(
    accountId: number,
    year: number,
    month: number,
  ): Promise<CreditCardInvoiceEntity | null> {
    return await this.findOne({
      where: { accountId, year, month },
      relations: ['account', 'transactions'],
    });
  }
  async findOrCreate(
    accountId: number,
    year: number,
    month: number,
    dueDate: Date,
  ): Promise<CreditCardInvoiceEntity> {
    let invoice = await this.findByMonthYear(accountId, year, month);
    if (!invoice) {
      invoice = await this.save({
        accountId,
        year,
        month,
        dueDate,
        totalAmount: 0,
        status: 'open' as InvoiceStatus,
      });
      invoice = await this.findByMonthYear(accountId, year, month);
    }
    return invoice!;
  }
  async findByStatus(
    userId: number,
    status: InvoiceStatus,
  ): Promise<CreditCardInvoiceEntity[]> {
    return await this.find({
      where: { account: { userId }, status },
      relations: ['account', 'transactions'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }
  async findOpenInvoices(userId: number): Promise<CreditCardInvoiceEntity[]> {
    return await this.findByStatus(userId, 'open');
  }
  async findClosedInvoices(userId: number): Promise<CreditCardInvoiceEntity[]> {
    return await this.findByStatus(userId, 'closed');
  }
  async findPaidInvoices(userId: number): Promise<CreditCardInvoiceEntity[]> {
    return await this.findByStatus(userId, 'paid');
  }
  async getCurrentInvoice(
    accountId: number,
    closingDay: number,
  ): Promise<CreditCardInvoiceEntity | null> {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    if (today.getDate() > closingDay) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return await this.findByMonthYear(accountId, year, month);
  }
  async updateTotalAmount(id: number, totalAmount: number): Promise<void> {
    await this.update({ id }, { totalAmount });
  }
  async addToTotalAmount(id: number, amount: number): Promise<void> {
    const invoice = await this.findOneBy({ id });
    if (invoice) {
      const newTotal = Number(invoice.totalAmount) + amount;
      await this.updateTotalAmount(id, newTotal);
    }
  }
  async closeInvoice(id: number): Promise<void> {
    await this.update({ id }, { status: 'closed' as InvoiceStatus });
  }
  async markAsPaid(id: number, paymentAccountId: number): Promise<void> {
    await this.update(
      { id },
      {
        status: 'paid' as InvoiceStatus,
        paidAt: new Date(),
        paymentAccountId,
      },
    );
  }
  async updateInvoice(
    id: number,
    userId: number,
    invoiceData: Partial<CreditCardInvoiceEntity>,
  ): Promise<CreditCardInvoiceEntity | null> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return null;
    }
    await this.update({ id }, invoiceData);
    return await this.findById(id, userId);
  }
  async deleteInvoice(id: number, userId: number): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return false;
    }
    await this.delete({ id });
    return true;
  }
  async recalculateTotalFromTransactions(id: number): Promise<number> {
    const invoice = await this.findOne({
      where: { id },
      relations: ['transactions'],
    });
    if (!invoice || !invoice.transactions) {
      return 0;
    }
    const total = invoice.transactions
      .filter((item) => item.status !== 'cancelled')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    await this.updateTotalAmount(id, total);
    return total;
  }
}
