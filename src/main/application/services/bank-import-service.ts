import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { BankImportEntity } from '../entities/bank-import.entity';
import { BankImportTransactionEntity } from '../entities/bank-import-transaction.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionService } from './transaction-service';
import { AccountRepository } from '../repositories/account-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { CategoryRepository } from '../repositories/category-repository';
import {
  BankImport,
  BankImportTransaction,
  CreateBankImportInput,
  ProcessImportInput,
  BankImportResult,
  ReconciliationSuggestion,
  BankCode,
} from '@shared/interfaces/types/bank-import.types';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
import { BalanceCalculatorService } from './balance-calculator-service';

export class BankImportService {
  private get importRepository() {
    return getDataSource().getRepository(BankImportEntity);
  }

  private get importTransactionRepository() {
    return getDataSource().getRepository(BankImportTransactionEntity);
  }

  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private mapEntityToImport(entity: BankImportEntity): BankImport {
    return {
      id: entity.id,
      userId: entity.userId,
      accountId: entity.accountId,
      bankCode: entity.bankCode,
      filename: entity.filename,
      fileType: entity.fileType,
      importDate: entity.importDate,
      startDate: entity.startDate
        ? (parseDateSafe(entity.startDate) ?? undefined)
        : undefined,
      endDate: entity.endDate
        ? (parseDateSafe(entity.endDate) ?? undefined)
        : undefined,
      totalTransactions: entity.totalTransactions,
      importedCount: entity.importedCount,
      duplicateCount: entity.duplicateCount,
      errorCount: entity.errorCount,
      status: entity.status,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
    };
  }

  private mapEntityToImportTransaction(
    entity: BankImportTransactionEntity,
  ): BankImportTransaction {
    return {
      id: entity.id,
      importId: entity.importId,
      externalId: entity.externalId,
      description: entity.description,
      amount: Number(entity.amount),
      transactionDate: parseDateSafe(entity.transactionDate) ?? new Date(),
      type: entity.type,
      rawData: entity.rawData,
      status: entity.status,
      matchedTransactionId: entity.matchedTransactionId,
      suggestedCategoryId: entity.suggestedCategoryId,
      suggestedCategoryName: entity.suggestedCategory?.name,
      confidenceScore: entity.confidenceScore
        ? Number(entity.confidenceScore)
        : undefined,
      createdAt: entity.createdAt,
    };
  }

  async createImport(
    userId: number,
    data: CreateBankImportInput,
  ): Promise<BankImport> {
    logger.info('Criando importação bancária para usuário:', userId);

    const bankImport = this.importRepository.create({
      userId,
      accountId: data.accountId,
      bankCode: data.bankCode,
      filename: data.file.filename,
      fileType: this.getFileType(data.file.filename),
      status: 'processing',
    });

    const saved = await this.importRepository.save(bankImport);

    try {
      // Parse file based on bank and type
      const transactions = await this.parseFile(data.bankCode, data.file);

      // Save parsed transactions
      for (const tx of transactions) {
        const importTx = this.importTransactionRepository.create({
          importId: saved.id,
          externalId: tx.externalId,
          description: tx.description,
          amount: Math.abs(tx.amount),
          transactionDate: tx.date,
          type: tx.amount >= 0 ? 'income' : 'expense',
          rawData: JSON.stringify(tx.raw),
          status: 'pending',
        });

        // Try to suggest category
        const suggestion = await this.suggestCategory(
          userId,
          tx.description,
          tx.amount,
        );
        if (suggestion) {
          importTx.suggestedCategoryId = suggestion.categoryId;
          importTx.confidenceScore = suggestion.confidence;
        }

        // Check for duplicates
        const isDuplicate = await this.checkDuplicate(
          userId,
          data.accountId,
          tx,
        );
        if (isDuplicate) {
          importTx.status = 'duplicate';
        }

        await this.importTransactionRepository.save(importTx);
      }

      // Update import stats
      const importTxs = await this.importTransactionRepository.find({
        where: { importId: saved.id },
      });

      saved.totalTransactions = importTxs.length;
      saved.duplicateCount = importTxs.filter(
        (t) => t.status === 'duplicate',
      ).length;
      saved.status = 'pending';
      saved.startDate =
        transactions.length > 0
          ? new Date(Math.min(...transactions.map((t) => t.date.getTime())))
          : undefined;
      saved.endDate =
        transactions.length > 0
          ? new Date(Math.max(...transactions.map((t) => t.date.getTime())))
          : undefined;

      await this.importRepository.save(saved);
      logger.success('Importação criada:', saved.id);

      return this.mapEntityToImport(saved);
    } catch (error) {
      saved.status = 'failed';
      saved.errorMessage =
        error instanceof Error ? error.message : 'Erro ao processar arquivo';
      await this.importRepository.save(saved);
      throw error;
    }
  }

  async processImport(
    userId: number,
    data: ProcessImportInput,
  ): Promise<BankImportResult> {
    logger.info('Processando importação:', data.importId);

    const bankImport = await this.importRepository.findOne({
      where: { id: data.importId, userId },
    });

    if (!bankImport) {
      throw new Error('Importação não encontrada');
    }

    const result: BankImportResult = {
      importId: data.importId,
      status: 'processing',
      totalProcessed: 0,
      imported: 0,
      matched: 0,
      ignored: 0,
      errors: [],
    };

    for (const action of data.actions) {
      try {
        const importTx = await this.importTransactionRepository.findOne({
          where: { id: action.importTransactionId, importId: data.importId },
        });

        if (!importTx || !['pending', 'duplicate'].includes(importTx.status))
          continue;

        result.totalProcessed++;

        switch (action.action) {
          case 'import':
            await this.importTransaction(
              userId,
              bankImport.accountId,
              importTx,
              action.categoryId,
            );
            importTx.status = 'imported';
            result.imported++;
            break;

          case 'match':
            if (action.matchedTransactionId) {
              importTx.matchedTransactionId = action.matchedTransactionId;
              importTx.status = 'matched';
              result.matched++;
            }
            break;

          case 'ignore':
            importTx.status = 'ignored';
            result.ignored++;
            break;
        }

        await this.importTransactionRepository.save(importTx);
      } catch (error) {
        result.errors.push({
          transactionId: action.importTransactionId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // Update import stats
    bankImport.importedCount = result.imported;
    bankImport.errorCount = result.errors.length;
    bankImport.status = 'completed';
    await this.importRepository.save(bankImport);

    result.status = 'completed';
    logger.success(
      `Importação processada: ${result.imported} importadas, ${result.matched} conciliadas`,
    );

    return result;
  }

  async getImport(userId: number, id: number): Promise<BankImport | null> {
    const bankImport = await this.importRepository.findOne({
      where: { id, userId },
    });

    return bankImport ? this.mapEntityToImport(bankImport) : null;
  }

  async getImportTransactions(
    importId: number,
  ): Promise<BankImportTransaction[]> {
    const transactions = await this.importTransactionRepository.find({
      where: { importId },
      relations: ['suggestedCategory'],
      order: { transactionDate: 'DESC' },
    });

    return transactions.map((t) => this.mapEntityToImportTransaction(t));
  }

  async getReconciliationSuggestions(
    userId: number,
    importId: number,
  ): Promise<ReconciliationSuggestion[]> {
    const importTxs = await this.importTransactionRepository.find({
      where: { importId, status: 'pending' },
    });

    const suggestions: ReconciliationSuggestion[] = [];

    for (const importTx of importTxs) {
      const possibleMatches = await this.findPossibleMatches(userId, importTx);

      if (possibleMatches.length > 0) {
        suggestions.push({
          importTransaction: this.mapEntityToImportTransaction(importTx),
          possibleMatches,
        });
      }
    }

    return suggestions;
  }

  async deleteImport(userId: number, id: number): Promise<void> {
    const bankImport = await this.importRepository.findOne({
      where: { id, userId },
    });

    if (!bankImport) {
      throw new Error('Importação não encontrada');
    }

    await this.importTransactionRepository.delete({ importId: id });
    await this.importRepository.remove(bankImport);

    logger.success('Importação excluída:', id);
  }

  private getFileType(filename: string): 'ofx' | 'csv' | 'xlsx' {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'ofx') return 'ofx';
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    return 'csv';
  }

  private async parseFile(
    bankCode: BankCode,
    file: { buffer: Buffer; filename: string },
  ): Promise<
    {
      externalId?: string;
      description: string;
      amount: number;
      date: Date;
      raw: unknown;
    }[]
  > {
    const content = file.buffer.toString('utf-8');
    const fileType = this.getFileType(file.filename);

    if (fileType === 'ofx') {
      return this.parseOFX(content, bankCode);
    } else if (fileType === 'csv') {
      return this.parseCSV(content, bankCode);
    }

    throw new Error('Formato de arquivo não suportado');
  }

  private parseOFX(
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bankCode: BankCode,
  ): {
    externalId?: string;
    description: string;
    amount: number;
    date: Date;
    raw: unknown;
  }[] {
    const transactions: {
      externalId?: string;
      description: string;
      amount: number;
      date: Date;
      raw: unknown;
    }[] = [];

    // Simple OFX parser for Santander format
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const txContent = match[1];

      const getValue = (tag: string): string => {
        const regex = new RegExp(`<${tag}>([^<\\n]+)`, 'i');
        const m = txContent.match(regex);
        return m ? m[1].trim() : '';
      };

      const dateStr = getValue('DTPOSTED');
      const amount = parseFloat(getValue('TRNAMT').replace(',', '.'));
      const fitid = getValue('FITID');
      const memo = getValue('MEMO') || getValue('NAME');

      if (dateStr && !isNaN(amount)) {
        // Parse OFX date format (YYYYMMDD or YYYYMMDDHHMMSS)
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));

        transactions.push({
          externalId: fitid,
          description: memo,
          amount,
          date: new Date(year, month, day),
          raw: { dateStr, amount, fitid, memo },
        });
      }
    }

    logger.info(`Parsed ${transactions.length} transactions from OFX`);
    return transactions;
  }

  private parseCSV(
    content: string,
    bankCode: BankCode,
  ): {
    externalId?: string;
    description: string;
    amount: number;
    date: Date;
    raw: unknown;
  }[] {
    const lines = content.split('\n').filter((l) => l.trim());
    const transactions: {
      externalId?: string;
      description: string;
      amount: number;
      date: Date;
      raw: unknown;
    }[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map((c) => c.trim().replace(/"/g, ''));

      if (bankCode === 'santander' && cols.length >= 4) {
        // Santander CSV format: Data;Histórico;Valor;Saldo
        const [dateStr, description, valueStr] = cols;
        const date = this.parseDate(dateStr);
        const amount = parseFloat(valueStr.replace('.', '').replace(',', '.'));

        if (date && !isNaN(amount)) {
          transactions.push({
            description,
            amount,
            date,
            raw: cols,
          });
        }
      }
    }

    logger.info(`Parsed ${transactions.length} transactions from CSV`);
    return transactions;
  }

  private parseDate(dateStr: string): Date | null {
    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  }

  private async suggestCategory(
    userId: number,
    description: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _amount: number,
  ): Promise<{ categoryId: number; confidence: number } | null> {
    // Find similar transactions and their categories
    const similar = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('LOWER(t.description) LIKE :desc', {
        desc: `%${description.toLowerCase().substring(0, 20)}%`,
      })
      .orderBy('t.created_at', 'DESC')
      .limit(5)
      .getMany();

    if (similar.length === 0) return null;

    // Count category occurrences
    const categoryCount = new Map<number, number>();
    for (const tx of similar) {
      categoryCount.set(
        tx.categoryId,
        (categoryCount.get(tx.categoryId) ?? 0) + 1,
      );
    }

    // Get most common category
    let maxCount = 0;
    let suggestedCategoryId = 0;
    for (const [categoryId, count] of categoryCount) {
      if (count > maxCount) {
        maxCount = count;
        suggestedCategoryId = categoryId;
      }
    }

    const confidence = maxCount / similar.length;
    return { categoryId: suggestedCategoryId, confidence };
  }

  private async checkDuplicate(
    userId: number,
    accountId: number,
    tx: { description: string; amount: number; date: Date },
  ): Promise<boolean> {
    const existing = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.account_id = :accountId', { accountId })
      .andWhere('t.amount = :amount', { amount: Math.abs(tx.amount) })
      .andWhere('t.transaction_date = :date', { date: tx.date })
      .andWhere('LOWER(t.description) = :desc', {
        desc: tx.description.toLowerCase(),
      })
      .getOne();

    return !!existing;
  }

  private async findPossibleMatches(
    userId: number,
    importTx: BankImportTransactionEntity,
  ): Promise<
    {
      transactionId: number;
      description: string;
      amount: number;
      date: Date;
      confidence: number;
    }[]
  > {
    // Find transactions within 3 days and similar amount
    const txDate = parseDateSafe(importTx.transactionDate) ?? new Date();
    const startDate = new Date(
      txDate.getFullYear(),
      txDate.getMonth(),
      txDate.getDate(),
    );
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(
      txDate.getFullYear(),
      txDate.getMonth(),
      txDate.getDate(),
    );
    endDate.setDate(endDate.getDate() + 3);

    const candidates = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.account', 'a')
      .where('a.user_id = :userId', { userId })
      .andWhere('t.transaction_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('ABS(t.amount - :amount) < :tolerance', {
        amount: importTx.amount,
        tolerance: importTx.amount * 0.01, // 1% tolerance
      })
      .getMany();

    return candidates
      .map((t) => {
        // Calculate confidence based on date proximity and description similarity
        const tDate = parseDateSafe(t.transactionDate) ?? new Date();
        const importTxDate =
          parseDateSafe(importTx.transactionDate) ?? new Date();
        const dateDiff = Math.abs(tDate.getTime() - importTxDate.getTime());
        const dateConfidence = 1 - dateDiff / (3 * 24 * 60 * 60 * 1000);

        const descSimilarity = this.calculateStringSimilarity(
          t.description.toLowerCase(),
          importTx.description.toLowerCase(),
        );

        const confidence = (dateConfidence + descSimilarity) / 2;

        return {
          transactionId: t.id,
          description: t.description,
          amount: Number(t.amount),
          date: tDate,
          confidence,
        };
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter((w) => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private async importTransaction(
    userId: number,
    accountId: number,
    importTx: BankImportTransactionEntity,
    categoryId?: number,
  ): Promise<void> {
    await getDataSource().transaction(async (manager) => {
      const imported = manager.getRepository(BankImportTransactionEntity);
      const current = await imported.findOneByOrFail({
        id: importTx.id,
        importId: importTx.importId,
      });
      if (!['pending', 'duplicate'].includes(current.status)) return;
      const accounts = new AccountRepository(manager),
        entries = new TransactionRepository(manager);
      const service = new TransactionService(
        entries,
        accounts,
        new CategoryRepository(manager),
        new BalanceCalculatorService(accounts, entries),
      );
      const category = categoryId ?? current.suggestedCategoryId;
      if (!category)
        throw new Error('Escolha uma categoria antes de importar.');
      const date = parseDateSafe(current.transactionDate);
      if (!date) throw new Error('Data do extrato inválida.');
      await service.create(userId, {
        description: importTx.description,
        amount: importTx.amount,
        type: importTx.type,
        transactionDate: date,
        status: 'settled',
        settlementDate: date,
        accountId,
        categoryId: category,
      });
      current.status = 'imported';
      await imported.save(current);
    });
  }
}
