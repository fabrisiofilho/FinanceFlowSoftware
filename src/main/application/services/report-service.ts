import {
  TransactionRepository,
  TransactionFilters,
} from '../repositories/transaction-repository';
import { logger } from '@main/infrastructure/log/logger';
import {
  ReportFilters,
  ReportData,
  ReportSummary,
  ExportResult,
  IncomeVsExpense,
} from '@shared/interfaces/types/report.types';
import { CategoryExpense } from '@shared/interfaces/types/transaction.types';
import { TransactionEntity } from '../entities/transaction.entity';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { repositoryCache } from '../repositories/repository-cache';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
export class ReportService {
  private _injectedTransactionRepository: TransactionRepository | null = null;
  private get transactionRepository(): TransactionRepository {
    if (this._injectedTransactionRepository) {
      return this._injectedTransactionRepository;
    }
    return repositoryCache.transactionRepository;
  }
  constructor(transactionRepository?: TransactionRepository) {
    if (transactionRepository) {
      this._injectedTransactionRepository = transactionRepository;
    }
  }
  private getExportDirectory(): string {
    const documentsPath = app.getPath('documents');
    const exportDir = path.join(documentsPath, 'Contabily', 'Relatorios');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    return exportDir;
  }
  private generateFilename(prefix: string, extension: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}_${timestamp}.${extension}`;
  }
  private escapeCSVValue(value: string | number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }
    const stringValue =
      typeof value === 'string' && /^[\s]*[=+@-]/.test(value)
        ? "'" + value
        : String(value);
    if (/[,"\n\r;]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
  private translateType(type: string): string {
    return type === 'income' ? 'Receita' : 'Despesa';
  }
  private translatePaymentMethod(method: string | undefined): string {
    if (!method) return '';
    const translations: Record<string, string> = {
      credit: 'Crédito',
      debit: 'Débito',
      pix: 'PIX',
      cash: 'Dinheiro',
    };
    return translations[method] || method;
  }
  async generateReport(
    userId: number,
    filters: ReportFilters,
  ): Promise<ReportData> {
    logger.info('Gerando relatório para usuário:', userId);
    const repoFilters: Omit<TransactionFilters, 'page' | 'size'> = {
      startDate: new Date(filters.startDate),
      endDate: new Date(filters.endDate),
      categoryId: filters.categoryId,
      categoryIds: filters.categoryIds,
      accountIds: filters.accountIds,
      types: filters.types,
      accountId: filters.accountId,
      type: filters.type,
    };
    const transactions =
      await this.transactionRepository.findWithFiltersNoPagination(
        userId,
        repoFilters,
      );
    let totalIncome = 0;
    let totalExpenses = 0;
    const monthly = new Map<string, IncomeVsExpense>();
    for (const transaction of transactions) {
      if (
        transaction.origin === 'transfer' ||
        transaction.status === 'cancelled'
      )
        continue;
      const amount = Number(transaction.amount);
      const date = parseDateSafe(transaction.transactionDate);
      if (date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const item = monthly.get(key) ?? {
          year,
          month,
          income: 0,
          expense: 0,
          balance: 0,
        };
        if (transaction.type === 'income') item.income += amount;
        else if (transaction.type === 'expense') item.expense += amount;
        item.balance = item.income - item.expense;
        monthly.set(key, item);
      }
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += amount;
      }
    }
    const expensesByCategoryMap = new Map<
      number,
      { name: string; total: number }
    >();
    for (const transaction of transactions) {
      if (transaction.type === 'expense') {
        const categoryId = transaction.categoryId;
        const categoryName = transaction.category?.name ?? 'Sem categoria';
        const amount = Number(transaction.amount);
        const existing = expensesByCategoryMap.get(categoryId);
        if (existing) {
          existing.total += amount;
        } else {
          expensesByCategoryMap.set(categoryId, {
            name: categoryName,
            total: amount,
          });
        }
      }
    }
    const expensesByCategory: CategoryExpense[] = Array.from(
      expensesByCategoryMap.entries(),
    ).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      totalAmount: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    }));
    expensesByCategory.sort((a, b) => b.totalAmount - a.totalAmount);
    const summary: ReportSummary = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: transactions.filter(
        (item) => item.origin !== 'transfer' && item.status !== 'cancelled',
      ).length,
      expensesByCategory,
    };
    const reportData: ReportData = {
      incomeVsExpenses: [...monthly.values()].sort(
        (a, b) => a.year - b.year || a.month - b.month,
      ),
      filters,
      summary,
      generatedAt: new Date(),
    };
    logger.success(
      'Relatório gerado com sucesso:',
      transactions.length,
      'transações',
    );
    return reportData;
  }
  async exportToCSV(
    userId: number,
    filters: ReportFilters,
  ): Promise<ExportResult> {
    logger.info('Exportando relatório para CSV para usuário:', userId);
    try {
      const repoFilters: Omit<TransactionFilters, 'page' | 'size'> = {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
        categoryId: filters.categoryId,
        categoryIds: filters.categoryIds,
        accountIds: filters.accountIds,
        types: filters.types,
        accountId: filters.accountId,
        type: filters.type,
      };
      const transactions =
        await this.transactionRepository.findWithFiltersNoPagination(
          userId,
          repoFilters,
        );
      const reportData = await this.generateReport(userId, filters);
      const headers = [
        'ID',
        'Data',
        'Descrição',
        'Tipo',
        'Categoria',
        'Conta',
        'Valor',
        'Forma de Pagamento',
        'Parcela',
      ];
      const rows: string[][] = transactions
        .filter(
          (item) => item.origin !== 'transfer' && item.status !== 'cancelled',
        )
        .map((transaction) => [
          String(transaction.id),
          this.formatDate(new Date(transaction.transactionDate)),
          transaction.description,
          this.translateType(transaction.type),
          transaction.category?.name ?? 'Sem categoria',
          transaction.account?.name ?? 'Conta desconhecida',
          String(Number(transaction.amount).toFixed(2)),
          this.translatePaymentMethod(transaction.paymentMethod),
          transaction.totalInstallments
            ? `${transaction.installmentNumber}/${transaction.totalInstallments}`
            : '',
        ]);
      const csvLines: string[] = [];
      csvLines.push(headers.map((h) => this.escapeCSVValue(h)).join(';'));
      for (const row of rows) {
        csvLines.push(row.map((cell) => this.escapeCSVValue(cell)).join(';'));
      }
      csvLines.push('');
      csvLines.push('');
      csvLines.push('RESUMO DO PERÍODO');
      csvLines.push(
        `Período;${this.formatDate(new Date(filters.startDate))} a ${this.formatDate(new Date(filters.endDate))}`,
      );
      csvLines.push(
        `Total de Transações;${reportData.summary.transactionCount}`,
      );
      csvLines.push(
        `Total de Receitas;${reportData.summary.totalIncome.toFixed(2)}`,
      );
      csvLines.push(
        `Total de Despesas;${reportData.summary.totalExpenses.toFixed(2)}`,
      );
      csvLines.push(
        `Saldo do Período;${reportData.summary.balance.toFixed(2)}`,
      );
      const csvContent = csvLines.join('\n');
      const exportDir = this.getExportDirectory();
      const filename = this.generateFilename('relatorio', 'csv');
      const filePath = path.join(exportDir, filename);
      const bom = '\uFEFF';
      fs.writeFileSync(filePath, bom + csvContent, 'utf8');
      const stats = fs.statSync(filePath);
      logger.success('Relatório CSV exportado com sucesso:', filePath);
      return {
        success: true,
        filePath,
        filename,
        fileSize: stats.size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao exportar CSV:', errorMessage);
      return {
        success: false,
        errorMessage: `Erro ao gerar arquivo CSV: ${errorMessage}`,
      };
    }
  }
  async exportToPDF(
    userId: number,
    filters: ReportFilters,
  ): Promise<ExportResult> {
    logger.info('Exportando relatório para PDF para usuário:', userId);
    try {
      const repoFilters: Omit<TransactionFilters, 'page' | 'size'> = {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
        categoryId: filters.categoryId,
        categoryIds: filters.categoryIds,
        accountIds: filters.accountIds,
        types: filters.types,
        accountId: filters.accountId,
        type: filters.type,
      };
      const transactions =
        await this.transactionRepository.findWithFiltersNoPagination(
          userId,
          repoFilters,
        );
      const reportData = await this.generateReport(userId, filters);
      const htmlContent = this.generatePDFHtml(
        transactions,
        reportData,
        filters,
      );
      const exportDir = this.getExportDirectory();
      const filename = this.generateFilename('relatorio', 'html');
      const filePath = path.join(exportDir, filename);
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      const stats = fs.statSync(filePath);
      logger.success('Relatório PDF (HTML) exportado com sucesso:', filePath);
      return {
        success: true,
        filePath,
        filename,
        fileSize: stats.size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao exportar PDF:', errorMessage);
      return {
        success: false,
        errorMessage: `Erro ao gerar arquivo PDF: ${errorMessage}`,
      };
    }
  }
  private generatePDFHtml(
    transactions: TransactionEntity[],
    reportData: ReportData,
    filters: ReportFilters,
  ): string {
    const periodStart = this.formatDate(new Date(filters.startDate));
    const periodEnd = this.formatDate(new Date(filters.endDate));
    const generatedAt = this.formatDate(reportData.generatedAt);
    const transactionRows = transactions
      .map(
        (t) => `
      <tr>
        <td>${this.formatDate(new Date(t.transactionDate))}</td>
        <td>${this.escapeHtml(t.description)}</td>
        <td class="${t.type === 'income' ? 'income' : 'expense'}">${this.translateType(t.type)}</td>
        <td>${this.escapeHtml(t.category?.name ?? 'Sem categoria')}</td>
        <td>${this.escapeHtml(t.account?.name ?? 'Conta desconhecida')}</td>
        <td class="${t.type === 'income' ? 'income' : 'expense'} amount">${this.formatCurrency(Number(t.amount))}</td>
      </tr>
    `,
      )
      .join('');
    const categoryRows = reportData.summary.expensesByCategory
      .map(
        (c) => `
      <tr>
        <td>${this.escapeHtml(c.categoryName)}</td>
        <td class="amount">${this.formatCurrency(c.totalAmount)}</td>
        <td>${c.percentage.toFixed(1)}%</td>
      </tr>
    `,
      )
      .join('');
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Financeiro - Contabily</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #135bec;
    }
    .header h1 {
      color: #135bec;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .header .period {
      margin-top: 10px;
      font-size: 12px;
      color: #888;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #135bec;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .summary-card .value {
      font-size: 18px;
      font-weight: bold;
    }
    .summary-card .value.income {
      color: #10b981;
    }
    .summary-card .value.expense {
      color: #ef4444;
    }
    .summary-card .value.balance {
      color: #135bec;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
      font-size: 11px;
      text-transform: uppercase;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .income {
      color: #10b981;
    }
    .expense {
      color: #ef4444;
    }
    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #888;
      font-size: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contabily</h1>
    <div class="subtitle">Relatório Financeiro</div>
    <div class="period">Período: ${periodStart} a ${periodEnd}</div>
  </div>
  <div class="section">
    <h2>Resumo do Período</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total de Receitas</div>
        <div class="value income">${this.formatCurrency(reportData.summary.totalIncome)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total de Despesas</div>
        <div class="value expense">${this.formatCurrency(reportData.summary.totalExpenses)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Saldo do Período</div>
        <div class="value balance">${this.formatCurrency(reportData.summary.balance)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Transações</div>
        <div class="value">${reportData.summary.transactionCount}</div>
      </div>
    </div>
  </div>
  ${
    reportData.summary.expensesByCategory.length > 0
      ? `
  <div class="section">
    <h2>Despesas por Categoria</h2>
    <table>
      <thead>
        <tr>
          <th>Categoria</th>
          <th class="amount">Valor</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>
  </div>
  `
      : ''
  }
  <div class="section">
    <h2>Transações do Período</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Tipo</th>
          <th>Categoria</th>
          <th>Conta</th>
          <th class="amount">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRows}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <p>Relatório gerado em ${generatedAt} pelo Contabily</p>
    <p>Este documento é para uso pessoal e não possui valor fiscal.</p>
  </div>
</body>
</html>
    `;
  }
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  }
  async getExpensesByCategory(
    userId: number,
    year: number,
    month: number,
  ): Promise<CategoryExpense[]> {
    logger.info(
      `Obtendo gastos por categoria ${month}/${year} para usuário:`,
      userId,
    );
    const expensesByCategoryRaw =
      await this.transactionRepository.getExpensesByCategory(
        userId,
        year,
        month,
      );
    const totalExpenses = expensesByCategoryRaw.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const expensesByCategory: CategoryExpense[] = expensesByCategoryRaw.map(
      (item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: Number(item.total),
        percentage:
          totalExpenses > 0 ? (Number(item.total) / totalExpenses) * 100 : 0,
      }),
    );
    logger.info(
      'Gastos por categoria calculados:',
      expensesByCategory.length,
      'categorias',
    );
    return expensesByCategory;
  }
  async getIncomeVsExpenses(
    userId: number,
    months: number = 6,
  ): Promise<IncomeVsExpense[]> {
    logger.info(
      `Obtendo evolução receitas x despesas dos últimos ${months} meses para usuário:`,
      userId,
    );
    const result: IncomeVsExpense[] = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const { totalIncome, totalExpenses } =
        await this.transactionRepository.getMonthSummary(userId, year, month);
      result.push({
        year,
        month,
        income: totalIncome,
        expense: totalExpenses,
        balance: totalIncome - totalExpenses,
      });
    }
    logger.info(
      'Evolução receitas x despesas calculada:',
      result.length,
      'meses',
    );
    return result;
  }
}
