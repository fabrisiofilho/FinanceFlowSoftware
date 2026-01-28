import { logger } from '@main/infrastructure/log/logger';
import type {
  ParsedCSVRow,
  ImportPreview,
  ImportResult,
} from '@shared/interfaces/types/import.types';
import { TransactionType } from '../entities/transaction.entity';
import { repositoryCache } from '../repositories/repository-cache';
interface SimpleCSVRow {
  mesAno: string;
  tipo: 'Receita' | 'Despesa';
  categoria: string;
  valor: number;
  data: Date;
}
export class ImportService {
  constructor() {}
  private get accountRepository() {
    return repositoryCache.accountRepository;
  }
  private get categoryRepository() {
    return repositoryCache.categoryRepository;
  }
  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }
  private detectFormat(csvContent: string): 'simple' | 'complete' {
    const firstLine = csvContent.trim().split('\n')[0].toLowerCase();
    if (
      firstLine.includes('mês/ano') ||
      firstLine.includes('mes/ano') ||
      (firstLine.includes('tipo') &&
        firstLine.includes('categoria') &&
        firstLine.includes('valor'))
    ) {
      return 'simple';
    }
    return 'complete';
  }
  private parseSimpleCSV(csvContent: string): SimpleCSVRow[] {
    const lines = csvContent.trim().split('\n');
    const rows: SimpleCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const separator = line.includes(';') ? ';' : ',';
      const values = line.split(separator);
      if (values.length < 4) continue;
      const mesAno = values[0].trim();
      const tipo = values[1].trim() as 'Receita' | 'Despesa';
      const categoria = values[2].trim();
      const valorStr = values[3].trim().replace(',', '.');
      const valor = parseFloat(valorStr) || 0;
      if (valor === 0) continue;
      const [mes, ano] = mesAno.split('/');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      rows.push({
        mesAno,
        tipo,
        categoria,
        valor,
        data,
      });
    }
    return rows;
  }
  private parseCompleteCSV(csvContent: string): ParsedCSVRow[] {
    const lines = csvContent.trim().split('\n');
    const rows: ParsedCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(';');
      if (values.length < 10) continue;
      const parseNumber = (val: string): number => {
        const cleaned = val.replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
      };
      const salario = parseNumber(values[2]);
      const dinheiroEmConta = parseNumber(values[3]);
      const bonus = parseNumber(values[4]);
      let cartaoBB: number,
        cartaoSantander: number,
        energia: number,
        internetEscola: number,
        aluguel: number;
      if (values.length >= 13) {
        cartaoBB = parseNumber(values[6]);
        cartaoSantander = parseNumber(values[7]);
        energia = parseNumber(values[8]);
        internetEscola = parseNumber(values[9]);
        aluguel = parseNumber(values[10]);
      } else {
        cartaoBB = parseNumber(values[5]);
        cartaoSantander = parseNumber(values[6]);
        energia = parseNumber(values[7]);
        internetEscola = parseNumber(values[8]);
        aluguel = parseNumber(values[9]);
      }
      const receitaTotal = salario + (bonus > 0 ? bonus : 0);
      const despesaTotal =
        cartaoBB + cartaoSantander + energia + internetEscola + aluguel;
      const excedente = receitaTotal - despesaTotal;
      rows.push({
        mesRef: values[0],
        dataReferencia: new Date(values[1]),
        salario,
        dinheiroEmConta,
        bonus,
        cartaoBB,
        cartaoSantander,
        energia,
        internetEscola,
        aluguel,
        receitaTotal,
        despesaTotal,
        excedente,
      });
    }
    return rows;
  }
  async previewCSV(csvContent: string): Promise<ImportPreview> {
    const format = this.detectFormat(csvContent);
    if (format === 'simple') {
      return this.previewSimpleCSV(csvContent);
    }
    return this.previewCompleteCSV(csvContent);
  }
  private async previewSimpleCSV(csvContent: string): Promise<ImportPreview> {
    const rows = this.parseSimpleCSV(csvContent);
    if (rows.length === 0) {
      throw new Error('Nenhum dado encontrado no CSV');
    }
    const dates = rows.map((r) => r.data);
    const totalIncome = rows
      .filter((r) => r.tipo === 'Receita')
      .reduce((sum, r) => sum + r.valor, 0);
    const totalExpenses = rows
      .filter((r) => r.tipo === 'Despesa')
      .reduce((sum, r) => sum + r.valor, 0);
    const uniqueCategories = [...new Set(rows.map((r) => r.categoria))];
    return {
      totalRows: rows.length,
      format: 'simple',
      dateRange: {
        start: new Date(Math.min(...dates.map((d) => d.getTime()))),
        end: new Date(Math.max(...dates.map((d) => d.getTime()))),
      },
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
      accountsToCreate: ['Conta Principal'],
      categoriesToCreate: uniqueCategories.map((c) =>
        this.formatCategoryName(c),
      ),
      simpleSampleRows: rows.slice(0, 10).map((r) => ({
        mesAno: r.mesAno,
        tipo: r.tipo,
        categoria: this.formatCategoryName(r.categoria),
        valor: r.valor,
      })),
      sampleRows: [],
    };
  }
  private async previewCompleteCSV(csvContent: string): Promise<ImportPreview> {
    const rows = this.parseCompleteCSV(csvContent);
    if (rows.length === 0) {
      throw new Error('Nenhum dado encontrado no CSV');
    }
    const dates = rows.map((r) => r.dataReferencia);
    const totalIncome = rows.reduce((sum, r) => sum + r.receitaTotal, 0);
    const totalExpenses = rows.reduce((sum, r) => sum + r.despesaTotal, 0);
    return {
      totalRows: rows.length,
      format: 'complete',
      dateRange: {
        start: new Date(Math.min(...dates.map((d) => d.getTime()))),
        end: new Date(Math.max(...dates.map((d) => d.getTime()))),
      },
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
      accountsToCreate: ['Conta Principal', 'Cartão BB', 'Cartão Santander'],
      categoriesToCreate: [
        'Salário',
        'Bônus',
        'Cartão de Crédito',
        'Energia',
        'Internet/Educação',
        'Aluguel',
      ],
      sampleRows: rows.slice(0, 5),
    };
  }
  async importCSV(userId: number, csvContent: string): Promise<ImportResult> {
    const format = this.detectFormat(csvContent);
    if (format === 'simple') {
      return this.importSimpleCSV(userId, csvContent);
    }
    return this.importCompleteCSV(userId, csvContent);
  }
  private async importSimpleCSV(
    userId: number,
    csvContent: string,
  ): Promise<ImportResult> {
    const rows = this.parseSimpleCSV(csvContent);
    const errors: string[] = [];
    let transactionsCreated = 0;
    let categoriesCreated = 0;
    logger.info(
      `Iniciando importação simples de ${rows.length} registros para usuário ${userId}`,
    );
    const accountId = await this.findOrCreateAccount(
      userId,
      'Conta Principal',
      'checking',
    );
    const categoryMap: Record<string, number> = {};
    const uniqueCategories = [...new Set(rows.map((r) => r.categoria))];
    for (const catName of uniqueCategories) {
      const row = rows.find((r) => r.categoria === catName);
      const type = row?.tipo === 'Receita' ? 'income' : 'expense';
      const icon = this.getCategoryIcon(catName);
      const formattedName = this.formatCategoryName(catName);
      const existingCat = await this.categoryRepository.findByName(
        userId,
        formattedName,
      );
      if (existingCat) {
        categoryMap[catName] = existingCat.id;
      } else {
        const created = await this.categoryRepository.createCategory({
          userId,
          name: formattedName,
          type,
          icon,
          isDefault: false,
        });
        categoryMap[catName] = created.id;
        categoriesCreated++;
      }
    }
    logger.info(`${categoriesCreated} categorias criadas`);
    for (const row of rows) {
      try {
        const type = row.tipo === 'Receita' ? 'income' : 'expense';
        const categoryId = categoryMap[row.categoria];
        await this.transactionRepository.createTransaction({
          description: this.formatCategoryName(row.categoria),
          amount: row.valor,
          type: type as TransactionType,
          transactionDate: row.data,
          accountId,
          categoryId,
          paymentMethod: type === 'expense' ? 'debit' : undefined,
          expenseType: type === 'expense' ? 'fixed' : undefined,
          recurrence: 'once',
        });
        transactionsCreated++;
      } catch (error) {
        const msg = `Erro ao importar ${row.mesAno} - ${row.categoria}: ${error}`;
        logger.error(msg);
        errors.push(msg);
      }
    }
    logger.success(
      `Importação concluída: ${transactionsCreated} transações criadas`,
    );
    return {
      success: errors.length === 0,
      accountsCreated: 1,
      categoriesCreated,
      transactionsCreated,
      errors,
    };
  }
  private formatCategoryName(name: string): string {
    const nameMap: Record<string, string> = {
      salario: 'Salário',
      cartao_bb: 'Cartão BB',
      cartao_santander: 'Cartão Santander',
      energia: 'Energia',
      escola: 'Escola',
      internet: 'Internet',
      santander: 'Santander',
      aluguel: 'Aluguel',
      bonus: 'Bônus',
    };
    const lowerName = name.toLowerCase();
    if (nameMap[lowerName]) {
      return nameMap[lowerName];
    }
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  private getCategoryIcon(categoryName: string): string {
    const iconMap: Record<string, string> = {
      salario: 'payments',
      cartao_bb: 'credit_card',
      cartao_santander: 'credit_card',
      santander: 'credit_card',
      energia: 'bolt',
      escola: 'school',
      internet: 'wifi',
      aluguel: 'home',
      bonus: 'card_giftcard',
    };
    return iconMap[categoryName.toLowerCase()] || 'category';
  }
  private async importCompleteCSV(
    userId: number,
    csvContent: string,
  ): Promise<ImportResult> {
    const rows = this.parseCompleteCSV(csvContent);
    const errors: string[] = [];
    let transactionsCreated = 0;
    logger.info(
      `Iniciando importação completa de ${rows.length} registros para usuário ${userId}`,
    );
    const accounts = await this.ensureAccounts(userId);
    const categories = await this.ensureCategories(userId);
    for (const row of rows) {
      try {
        const created = await this.importRow(userId, row, accounts, categories);
        transactionsCreated += created;
      } catch (error) {
        const msg = `Erro ao importar linha ${row.mesRef}: ${error}`;
        logger.error(msg);
        errors.push(msg);
      }
    }
    logger.success(
      `Importação concluída: ${transactionsCreated} transações criadas`,
    );
    return {
      success: errors.length === 0,
      accountsCreated: 3,
      categoriesCreated: 6,
      transactionsCreated,
      errors,
    };
  }
  private async ensureAccounts(
    userId: number,
  ): Promise<Record<string, number>> {
    const accounts: Record<string, number> = {};
    accounts['principal'] = await this.findOrCreateAccount(
      userId,
      'Conta Principal',
      'checking',
    );
    accounts['cartao_bb'] = await this.findOrCreateAccount(
      userId,
      'Cartão BB',
      'credit_card',
      5000,
      10,
    );
    accounts['cartao_santander'] = await this.findOrCreateAccount(
      userId,
      'Cartão Santander',
      'credit_card',
      5000,
      15,
    );
    return accounts;
  }
  private async findOrCreateAccount(
    userId: number,
    name: string,
    type: 'checking' | 'savings' | 'credit_card' | 'wallet',
    creditLimit?: number,
    closingDay?: number,
  ): Promise<number> {
    const existing = await this.accountRepository.findByName(userId, name);
    if (existing) return existing.id;
    const created = await this.accountRepository.createAccount({
      userId,
      name,
      type,
      balance: 0,
      creditLimit,
      closingDay,
    });
    return created.id;
  }
  private async ensureCategories(
    userId: number,
  ): Promise<Record<string, number>> {
    const categories: Record<string, number> = {};
    categories['salario'] = await this.findOrCreateCategory(
      userId,
      'Salário',
      'income',
      'payments',
    );
    categories['bonus'] = await this.findOrCreateCategory(
      userId,
      'Bônus',
      'income',
      'card_giftcard',
    );
    categories['cartao'] = await this.findOrCreateCategory(
      userId,
      'Cartão de Crédito',
      'expense',
      'credit_card',
    );
    categories['energia'] = await this.findOrCreateCategory(
      userId,
      'Energia',
      'expense',
      'bolt',
    );
    categories['internet'] = await this.findOrCreateCategory(
      userId,
      'Internet/Educação',
      'expense',
      'school',
    );
    categories['aluguel'] = await this.findOrCreateCategory(
      userId,
      'Aluguel',
      'expense',
      'home',
    );
    return categories;
  }
  private async findOrCreateCategory(
    userId: number,
    name: string,
    type: 'income' | 'expense',
    icon: string,
  ): Promise<number> {
    const existing = await this.categoryRepository.findByName(userId, name);
    if (existing) return existing.id;
    const created = await this.categoryRepository.createCategory({
      userId,
      name,
      type,
      icon,
      isDefault: false,
    });
    return created.id;
  }
  private async importRow(
    _userId: number,
    row: ParsedCSVRow,
    accounts: Record<string, number>,
    categories: Record<string, number>,
  ): Promise<number> {
    let count = 0;
    const date = row.dataReferencia;
    if (row.salario > 0) {
      await this.createTransaction(
        'Salário',
        row.salario,
        'income',
        date,
        accounts['principal'],
        categories['salario'],
      );
      count++;
    }
    if (row.bonus > 0) {
      await this.createTransaction(
        'Bônus',
        row.bonus,
        'income',
        date,
        accounts['principal'],
        categories['bonus'],
      );
      count++;
    }
    if (row.cartaoBB > 0) {
      await this.createTransaction(
        'Fatura Cartão BB',
        row.cartaoBB,
        'expense',
        date,
        accounts['cartao_bb'],
        categories['cartao'],
        'credit',
      );
      count++;
    }
    if (row.cartaoSantander > 0) {
      await this.createTransaction(
        'Fatura Cartão Santander',
        row.cartaoSantander,
        'expense',
        date,
        accounts['cartao_santander'],
        categories['cartao'],
        'credit',
      );
      count++;
    }
    if (row.energia > 0) {
      await this.createTransaction(
        'Energia',
        row.energia,
        'expense',
        date,
        accounts['principal'],
        categories['energia'],
        'debit',
        'fixed',
      );
      count++;
    }
    if (row.internetEscola > 0) {
      await this.createTransaction(
        'Internet/Educação',
        row.internetEscola,
        'expense',
        date,
        accounts['principal'],
        categories['internet'],
        'debit',
        'fixed',
      );
      count++;
    }
    if (row.aluguel > 0) {
      await this.createTransaction(
        'Aluguel',
        row.aluguel,
        'expense',
        date,
        accounts['principal'],
        categories['aluguel'],
        'debit',
        'fixed',
      );
      count++;
    }
    return count;
  }
  private async createTransaction(
    description: string,
    amount: number,
    type: 'income' | 'expense',
    date: Date,
    accountId: number,
    categoryId: number,
    paymentMethod?: 'credit' | 'debit' | 'pix' | 'cash',
    expenseType?: 'fixed' | 'variable',
  ): Promise<void> {
    await this.transactionRepository.createTransaction({
      description,
      amount,
      type: type as TransactionType,
      transactionDate: date,
      accountId,
      categoryId,
      paymentMethod,
      expenseType,
      recurrence: 'once',
    });
  }
}
