import { logger } from '@main/infrastructure/log/logger';
import type {
  ImportConfig,
  CSVPreviewData,
  ImportPreview,
  ImportResult,
  ParsedTransaction,
  ColumnMapping,
} from '@shared/interfaces/types/import.types';
import { TransactionType } from '../entities/transaction.entity';
import { repositoryCache } from '../repositories/repository-cache';
import { BalanceCalculatorService } from './balance-calculator-service';

export class ImportService {
  private balanceCalculatorService: BalanceCalculatorService;

  constructor() {
    this.balanceCalculatorService = new BalanceCalculatorService();
  }

  private get accountRepository() {
    return repositoryCache.accountRepository;
  }

  private get categoryRepository() {
    return repositoryCache.categoryRepository;
  }

  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }

  /**
   * Detect delimiter from CSV content
   */
  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    const delimiters = [';', ',', '\t', '|'];
    let maxCount = 0;
    let detected = ',';

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || [])
        .length;
      if (count > maxCount) {
        maxCount = count;
        detected = delimiter;
      }
    }

    return detected;
  }

  /**
   * Detect if CSV has header row
   */
  private detectHasHeader(rows: string[][]): boolean {
    if (rows.length < 2) return false;

    const firstRow = rows[0];
    const secondRow = rows[1];

    // Check if first row has more text-like values and second row has more number-like values
    let firstRowTextCount = 0;
    let secondRowNumberCount = 0;

    for (let i = 0; i < firstRow.length; i++) {
      const firstVal = firstRow[i]?.trim() || '';
      const secondVal = secondRow[i]?.trim() || '';

      // Check if first row value looks like a header (text, no numbers)
      if (
        firstVal &&
        !/^\d/.test(firstVal) &&
        !/^\d{1,2}[\/\-]/.test(firstVal)
      ) {
        firstRowTextCount++;
      }

      // Check if second row value looks like data (number or date)
      if (
        secondVal &&
        (/^\d/.test(secondVal) || /^\d{1,2}[\/\-]/.test(secondVal))
      ) {
        secondRowNumberCount++;
      }
    }

    return (
      firstRowTextCount > firstRow.length / 2 ||
      secondRowNumberCount > secondRow.length / 2
    );
  }

  /**
   * Parse CSV content into rows
   */
  private parseCSVRows(content: string, delimiter: string): string[][] {
    const lines = content.trim().split('\n');
    return lines.map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }

      values.push(current.trim().replace(/^"|"$/g, ''));
      return values;
    });
  }

  /**
   * Get CSV preview data for column mapping
   */
  async getCSVPreview(csvContent: string): Promise<CSVPreviewData> {
    const delimiter = this.detectDelimiter(csvContent);
    const rows = this.parseCSVRows(csvContent, delimiter);
    const hasHeader = this.detectHasHeader(rows);

    const headers = hasHeader
      ? rows[0].map((h, i) => h || `Coluna ${i + 1}`)
      : rows[0].map((_, i) => `Coluna ${i + 1}`);

    const dataRows = hasHeader ? rows.slice(1) : rows;
    const sampleRows = dataRows.slice(0, 10);

    return {
      headers,
      rows: sampleRows,
      totalRows: dataRows.length,
      detectedDelimiter: delimiter,
      detectedHasHeader: hasHeader,
    };
  }

  /**
   * Parse date string according to format
   */
  private parseDate(dateStr: string, format: string): Date | null {
    if (!dateStr) return null;

    const cleanDate = dateStr.trim();
    let day: number, month: number, year: number;

    try {
      switch (format) {
        case 'DD/MM/YYYY':
        case 'DD-MM-YYYY':
        case 'DD.MM.YYYY': {
          const parts = cleanDate.split(/[\/\-\.]/);
          day = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          year = parseInt(parts[2]);
          break;
        }
        case 'MM/DD/YYYY': {
          const parts = cleanDate.split('/');
          month = parseInt(parts[0]) - 1;
          day = parseInt(parts[1]);
          year = parseInt(parts[2]);
          break;
        }
        case 'YYYY-MM-DD': {
          const parts = cleanDate.split('-');
          year = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          day = parseInt(parts[2]);
          break;
        }
        default:
          return null;
      }

      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

      // Handle 2-digit years
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }

      return new Date(year, month, day);
    } catch {
      return null;
    }
  }

  /**
   * Parse amount string according to number format
   */
  private parseAmount(amountStr: string, numberFormat: string): number {
    if (!amountStr) return 0;

    let cleaned = amountStr.trim();

    // Remove currency symbols and spaces
    cleaned = cleaned.replace(/[R$€£¥\s]/g, '');

    // If the string is empty after cleaning, return 0
    if (!cleaned) return 0;

    // Count occurrences of . and ,
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;

    let actualDecimalSep: string;

    if (numberFormat === 'brazilian') {
      // Brazilian: 1.234,56 - comma is decimal, dot is thousands
      actualDecimalSep = ',';
    } else if (numberFormat === 'international') {
      // International: 1,234.56 - dot is decimal, comma is thousands
      actualDecimalSep = '.';
    } else {
      // Auto-detect
      // If there's only one dot and no comma, and dot is in decimal position (1-2 digits after)
      if (dotCount === 1 && commaCount === 0) {
        const dotPos = cleaned.indexOf('.');
        const afterDot = cleaned.length - dotPos - 1;
        actualDecimalSep = afterDot <= 2 ? '.' : ',';
      }
      // If there's only one comma and no dot, and comma is in decimal position
      else if (commaCount === 1 && dotCount === 0) {
        const commaPos = cleaned.indexOf(',');
        const afterComma = cleaned.length - commaPos - 1;
        actualDecimalSep = afterComma <= 2 ? ',' : '.';
      }
      // If both exist, the last one is likely the decimal separator
      else if (dotCount > 0 && commaCount > 0) {
        const lastDot = cleaned.lastIndexOf('.');
        const lastComma = cleaned.lastIndexOf(',');
        actualDecimalSep = lastDot > lastComma ? '.' : ',';
      }
      // Default to international format
      else {
        actualDecimalSep = '.';
      }
    }

    // Remove thousands separator (the one that's NOT the decimal separator)
    if (actualDecimalSep === '.') {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(/\./g, '');
    }

    // Replace decimal separator with dot for parseFloat
    if (actualDecimalSep === ',') {
      cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Determine transaction type from value or keywords
   */
  private determineType(
    row: string[],
    mappings: ColumnMapping[],
    amount: number,
    config: ImportConfig,
  ): 'income' | 'expense' {
    // Check if there's a type column
    const typeMapping = mappings.find((m) => m.fieldType === 'type');
    if (typeMapping) {
      const typeValue = row[typeMapping.columnIndex]?.toLowerCase() || '';

      for (const keyword of config.incomeKeywords) {
        if (typeValue.includes(keyword.toLowerCase())) {
          return 'income';
        }
      }

      for (const keyword of config.expenseKeywords) {
        if (typeValue.includes(keyword.toLowerCase())) {
          return 'expense';
        }
      }
    }

    // Check description for keywords
    const descMapping = mappings.find((m) => m.fieldType === 'description');
    if (descMapping) {
      const desc = row[descMapping.columnIndex]?.toLowerCase() || '';

      for (const keyword of config.incomeKeywords) {
        if (desc.includes(keyword.toLowerCase())) {
          return 'income';
        }
      }
    }

    // Default: negative = expense, positive = income
    return amount < 0 ? 'expense' : 'income';
  }

  /**
   * Parse transactions from CSV using config
   */
  private parseTransactions(
    csvContent: string,
    config: ImportConfig,
  ): { transactions: ParsedTransaction[]; errors: string[] } {
    const rows = this.parseCSVRows(csvContent, config.delimiter);
    const dataRows = config.hasHeader ? rows.slice(1) : rows;

    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    const dateMapping = config.columnMappings.find(
      (m) => m.fieldType === 'date',
    );
    const descMapping = config.columnMappings.find(
      (m) => m.fieldType === 'description',
    );
    const amountMapping = config.columnMappings.find(
      (m) => m.fieldType === 'amount',
    );
    const categoryMapping = config.columnMappings.find(
      (m) => m.fieldType === 'category',
    );

    if (!dateMapping || !amountMapping) {
      errors.push('Mapeamento de Data e Valor são obrigatórios');
      return { transactions, errors };
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = config.hasHeader ? i + 2 : i + 1;

      try {
        // Parse date
        const dateStr = row[dateMapping.columnIndex];
        const date = this.parseDate(dateStr, config.dateFormat);
        if (!date) {
          errors.push(`Linha ${rowNum}: Data inválida "${dateStr}"`);
          continue;
        }

        // Parse amount
        const amountStr = row[amountMapping.columnIndex];
        let amount = this.parseAmount(amountStr, config.numberFormat);

        if (amount === 0) {
          continue; // Skip zero amount transactions
        }

        // Get description
        const description = descMapping
          ? row[descMapping.columnIndex]?.trim() || 'Sem descrição'
          : 'Transação importada';

        // Determine type
        const type = this.determineType(
          row,
          config.columnMappings,
          amount,
          config,
        );

        // Make amount positive
        amount = Math.abs(amount);

        // Get category if mapped
        const category = categoryMapping
          ? row[categoryMapping.columnIndex]?.trim()
          : undefined;

        transactions.push({
          date,
          description,
          amount,
          type,
          category,
          rawRow: row,
        });
      } catch (error) {
        errors.push(
          `Linha ${rowNum}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }
    }

    return { transactions, errors };
  }

  /**
   * Preview import with configuration
   */
  async previewImport(
    csvContent: string,
    config: ImportConfig,
  ): Promise<ImportPreview> {
    const { transactions, errors } = this.parseTransactions(csvContent, config);

    if (transactions.length === 0) {
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: errors.length,
        dateRange: { start: new Date(), end: new Date() },
        summary: { totalIncome: 0, totalExpenses: 0, balance: 0 },
        categoriesToCreate: [],
        sampleTransactions: [],
        errors:
          errors.length > 0 ? errors : ['Nenhuma transação válida encontrada'],
      };
    }

    const dates = transactions.map((t) => t.date.getTime());
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get unique categories
    const categories = [
      ...new Set(
        transactions.filter((t) => t.category).map((t) => t.category!),
      ),
    ];

    return {
      totalRows: transactions.length + errors.length,
      validRows: transactions.length,
      invalidRows: errors.length,
      dateRange: {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates)),
      },
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
      categoriesToCreate: categories,
      sampleTransactions: transactions, // Return ALL transactions for editing
      errors: errors.slice(0, 10),
    };
  }

  /**
   * Import CSV with configuration
   */
  async importCSV(
    userId: number,
    csvContent: string,
    config: ImportConfig,
  ): Promise<ImportResult> {
    const { transactions, errors } = this.parseTransactions(csvContent, config);

    let transactionsCreated = 0;
    let categoriesCreated = 0;
    const importErrors: string[] = [...errors];

    logger.info(
      `Iniciando importação de ${transactions.length} transações para usuário ${userId}`,
    );

    // Get or create default account
    const accountId =
      config.defaultAccountId || (await this.getOrCreateDefaultAccount(userId));

    // Create category map
    const categoryMap: Record<string, number> = {};

    for (const tx of transactions) {
      try {
        // Get or create category
        let categoryId: number;

        if (tx.category) {
          if (categoryMap[tx.category]) {
            categoryId = categoryMap[tx.category];
          } else {
            const existing = await this.categoryRepository.findByName(
              userId,
              tx.category,
            );
            if (existing) {
              categoryId = existing.id;
            } else {
              const created = await this.categoryRepository.createCategory({
                userId,
                name: tx.category,
                type: tx.type,
                icon: 'category',
                isDefault: false,
              });
              categoryId = created.id;
              categoriesCreated++;
            }
            categoryMap[tx.category] = categoryId;
          }
        } else {
          // Use default category
          categoryId = await this.getOrCreateDefaultCategory(userId, tx.type);
        }

        // Create transaction
        await this.transactionRepository.createTransaction({
          description: tx.description,
          amount: tx.amount,
          type: tx.type as TransactionType,
          transactionDate: tx.date,
          accountId,
          categoryId,
          paymentMethod: tx.type === 'expense' ? 'debit' : undefined,
          recurrence: 'once',
        });

        // Update account balance
        await this.balanceCalculatorService.updateBalanceAfterCreate(
          userId,
          accountId,
          tx.type as TransactionType,
          tx.amount,
        );

        transactionsCreated++;
      } catch (error) {
        importErrors.push(
          `Erro ao importar "${tx.description}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }
    }

    logger.success(
      `Importação concluída: ${transactionsCreated} transações criadas, ${categoriesCreated} categorias criadas`,
    );

    return {
      success: importErrors.length === 0,
      categoriesCreated,
      transactionsCreated,
      errors: importErrors,
    };
  }

  /**
   * Import transactions directly (from edited list)
   */
  async importTransactions(
    userId: number,
    config: ImportConfig,
    transactions: ParsedTransaction[],
  ): Promise<ImportResult> {
    let transactionsCreated = 0;
    let categoriesCreated = 0;
    const importErrors: string[] = [];

    logger.info(
      `Iniciando importação de ${transactions.length} transações editadas para usuário ${userId}`,
    );

    // Get or create default account
    const accountId =
      config.defaultAccountId || (await this.getOrCreateDefaultAccount(userId));

    // Create category map
    const categoryMap: Record<string, number> = {};

    for (const tx of transactions) {
      try {
        // Get or create category
        let categoryId: number;

        if (tx.category) {
          if (categoryMap[tx.category]) {
            categoryId = categoryMap[tx.category];
          } else {
            const existing = await this.categoryRepository.findByName(
              userId,
              tx.category,
            );
            if (existing) {
              categoryId = existing.id;
            } else {
              const created = await this.categoryRepository.createCategory({
                userId,
                name: tx.category,
                type: tx.type,
                icon: 'category',
                isDefault: false,
              });
              categoryId = created.id;
              categoriesCreated++;
            }
            categoryMap[tx.category] = categoryId;
          }
        } else {
          // Use default category
          categoryId = await this.getOrCreateDefaultCategory(userId, tx.type);
        }

        // Create transaction
        await this.transactionRepository.createTransaction({
          description: tx.description,
          amount: tx.amount,
          type: tx.type as TransactionType,
          transactionDate: new Date(tx.date),
          accountId,
          categoryId,
          paymentMethod: tx.type === 'expense' ? 'debit' : undefined,
          recurrence: 'once',
        });

        // Update account balance
        await this.balanceCalculatorService.updateBalanceAfterCreate(
          userId,
          accountId,
          tx.type as TransactionType,
          tx.amount,
        );

        transactionsCreated++;
      } catch (error) {
        importErrors.push(
          `Erro ao importar "${tx.description}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }
    }

    logger.success(
      `Importação concluída: ${transactionsCreated} transações criadas, ${categoriesCreated} categorias criadas`,
    );

    return {
      success: importErrors.length === 0,
      categoriesCreated,
      transactionsCreated,
      errors: importErrors,
    };
  }

  private async getOrCreateDefaultAccount(userId: number): Promise<number> {
    const accounts = await this.accountRepository.findAllByUserId(userId);
    if (accounts.length > 0) {
      return accounts[0].id;
    }

    const created = await this.accountRepository.createAccount({
      userId,
      name: 'Conta Principal',
      type: 'checking',
      balance: 0,
    });
    return created.id;
  }

  private async getOrCreateDefaultCategory(
    userId: number,
    type: 'income' | 'expense',
  ): Promise<number> {
    const name = type === 'income' ? 'Receita Geral' : 'Despesa Geral';

    const existing = await this.categoryRepository.findByName(userId, name);
    if (existing) return existing.id;

    const created = await this.categoryRepository.createCategory({
      userId,
      name,
      type,
      icon: type === 'income' ? 'trending_up' : 'trending_down',
      isDefault: true,
    });
    return created.id;
  }
}
