import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { TransferEntity } from '../entities/transfer.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { AccountEntity } from '../entities/account.entity';
import {
  Transfer,
  CreateTransferInput,
  TransferFilters,
  TransferSummary,
} from '@shared/interfaces/types/transfer.types';
import { parseDateSafe } from '@main/infrastructure/utils/date-utils';
import { validateTransferValues } from '../../domain/financial-validation';
import { TransferCategoryService } from './transfer-category-service';

export class TransferService {
  private readonly categoryService = new TransferCategoryService();
  private get transferRepository() {
    return getDataSource().getRepository(TransferEntity);
  }

  private get transactionRepository() {
    return getDataSource().getRepository(TransactionEntity);
  }

  private get accountRepository() {
    return getDataSource().getRepository(AccountEntity);
  }

  private mapEntityToTransfer(entity: TransferEntity): Transfer {
    const fromAccount = entity.fromAccount as AccountEntity | undefined;
    const toAccount = entity.toAccount as AccountEntity | undefined;

    return {
      id: entity.id,
      userId: entity.userId,
      fromAccountId: entity.fromAccountId,
      toAccountId: entity.toAccountId,
      fromAccountName: fromAccount?.name,
      toAccountName: toAccount?.name,
      amount: Number(entity.amount),
      fromCurrencyId: entity.fromCurrencyId,
      toCurrencyId: entity.toCurrencyId,
      exchangeRate: Number(entity.exchangeRate),
      convertedAmount: entity.convertedAmount
        ? Number(entity.convertedAmount)
        : undefined,
      description: entity.description,
      transferDate: parseDateSafe(entity.transferDate) ?? new Date(),
      fromTransactionId: entity.fromTransactionId,
      toTransactionId: entity.toTransactionId,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  async create(userId: number, data: CreateTransferInput): Promise<Transfer> {
    const convertedAmount = validateTransferValues(
      data.amount,
      data.exchangeRate ?? 1,
    );
    const transferDate = parseDateSafe(data.transferDate);
    if (!transferDate || !Number.isFinite(transferDate.getTime()))
      throw new Error('Data de transferência inválida');
    logger.info('Criando transferência para usuário:', userId);

    if (data.fromAccountId === data.toAccountId) {
      throw new Error('Conta de origem e destino devem ser diferentes');
    }

    const fromAccount = await this.accountRepository.findOne({
      where: { id: data.fromAccountId, userId },
    });
    const toAccount = await this.accountRepository.findOne({
      where: { id: data.toAccountId, userId },
    });

    if (!fromAccount || !toAccount) {
      throw new Error('Conta não encontrada');
    }

    const dataSource = getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expenseCategoryId = await this.categoryService.getOrCreate(
        queryRunner.manager,
        userId,
        'expense',
      );
      const incomeCategoryId = await this.categoryService.getOrCreate(
        queryRunner.manager,
        userId,
        'income',
      );
      // Create expense transaction (from account)
      const fromTransaction = this.transactionRepository.create({
        description: data.description || `Transferência para ${toAccount.name}`,
        amount: data.amount,
        type: 'expense',
        paymentMethod: 'pix',
        origin: 'transfer',
        status: 'settled',
        settlementDate: transferDate,
        transactionDate: transferDate,
        accountId: data.fromAccountId,
        categoryId: expenseCategoryId,
      });
      const savedFromTx = await queryRunner.manager.save(fromTransaction);

      // Create income transaction (to account)

      const toTransaction = this.transactionRepository.create({
        description: data.description || `Transferência de ${fromAccount.name}`,
        amount: convertedAmount,
        type: 'income',
        paymentMethod: 'pix',
        origin: 'transfer',
        status: 'settled',
        settlementDate: transferDate,
        transactionDate: transferDate,
        accountId: data.toAccountId,
        categoryId: incomeCategoryId,
      });
      const savedToTx = await queryRunner.manager.save(toTransaction);

      // Create transfer record
      const transfer = this.transferRepository.create({
        userId,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        exchangeRate: data.exchangeRate ?? 1,
        convertedAmount: data.exchangeRate ? convertedAmount : undefined,
        description: data.description,
        transferDate,
        fromTransactionId: savedFromTx.id,
        toTransactionId: savedToTx.id,
      });
      const savedTransfer = await queryRunner.manager.save(transfer);

      // Update account balances
      fromAccount.balance = Number(fromAccount.balance) - data.amount;
      toAccount.balance = Number(toAccount.balance) + convertedAmount;
      await queryRunner.manager.save(fromAccount);
      await queryRunner.manager.save(toAccount);

      await queryRunner.commitTransaction();
      logger.success('Transferência criada:', savedTransfer.id);

      return this.findById(userId, savedTransfer.id) as Promise<Transfer>;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(userId: number, id: number): Promise<void> {
    logger.info('Excluindo transferência:', id);

    const transfer = await this.transferRepository.findOne({
      where: { id, userId },
    });

    if (!transfer) {
      throw new Error('Transferência não encontrada');
    }

    const dataSource = getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Reverse account balances
      const fromAccount = await this.accountRepository.findOne({
        where: { id: transfer.fromAccountId },
      });
      const toAccount = await this.accountRepository.findOne({
        where: { id: transfer.toAccountId },
      });

      if (fromAccount) {
        fromAccount.balance =
          Number(fromAccount.balance) + Number(transfer.amount);
        await queryRunner.manager.save(fromAccount);
      }

      if (toAccount) {
        const amountToReverse = transfer.convertedAmount ?? transfer.amount;
        toAccount.balance = Number(toAccount.balance) - Number(amountToReverse);
        await queryRunner.manager.save(toAccount);
      }

      // Delete related transactions
      if (transfer.fromTransactionId) {
        await queryRunner.manager.delete(
          TransactionEntity,
          transfer.fromTransactionId,
        );
      }
      if (transfer.toTransactionId) {
        await queryRunner.manager.delete(
          TransactionEntity,
          transfer.toTransactionId,
        );
      }

      // Delete transfer
      await queryRunner.manager.remove(transfer);

      await queryRunner.commitTransaction();
      logger.success('Transferência excluída:', id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(userId: number, id: number): Promise<Transfer | null> {
    const transfer = await this.transferRepository.findOne({
      where: { id, userId },
      relations: ['fromAccount', 'toAccount'],
    });

    return transfer ? this.mapEntityToTransfer(transfer) : null;
  }

  async findAll(
    userId: number,
    filters?: TransferFilters,
  ): Promise<Transfer[]> {
    const query = this.transferRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.fromAccount', 'fromAccount')
      .leftJoinAndSelect('t.toAccount', 'toAccount')
      .where('t.user_id = :userId', { userId });

    if (filters?.startDate) {
      query.andWhere('t.transfer_date >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query.andWhere('t.transfer_date <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters?.fromAccountId) {
      query.andWhere('t.from_account_id = :fromAccountId', {
        fromAccountId: filters.fromAccountId,
      });
    }
    if (filters?.toAccountId) {
      query.andWhere('t.to_account_id = :toAccountId', {
        toAccountId: filters.toAccountId,
      });
    }

    query.orderBy('t.transfer_date', 'DESC');

    const results = await query.getMany();
    return results.map((t) => this.mapEntityToTransfer(t));
  }

  async getSummary(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TransferSummary> {
    const transfers = await this.findAll(userId, { startDate, endDate });

    const byAccountMap = new Map<
      number,
      { name: string; incoming: number; outgoing: number }
    >();

    for (const transfer of transfers) {
      // From account (outgoing)
      if (!byAccountMap.has(transfer.fromAccountId)) {
        byAccountMap.set(transfer.fromAccountId, {
          name: transfer.fromAccountName ?? '',
          incoming: 0,
          outgoing: 0,
        });
      }
      const fromEntry = byAccountMap.get(transfer.fromAccountId)!;
      fromEntry.outgoing += transfer.amount;

      // To account (incoming)
      if (!byAccountMap.has(transfer.toAccountId)) {
        byAccountMap.set(transfer.toAccountId, {
          name: transfer.toAccountName ?? '',
          incoming: 0,
          outgoing: 0,
        });
      }
      const toEntry = byAccountMap.get(transfer.toAccountId)!;
      toEntry.incoming += transfer.convertedAmount ?? transfer.amount;
    }

    const byAccount = Array.from(byAccountMap.entries()).map(
      ([accountId, data]) => ({
        accountId,
        accountName: data.name,
        incoming: data.incoming,
        outgoing: data.outgoing,
        net: data.incoming - data.outgoing,
      }),
    );

    return {
      totalTransfers: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
      byAccount,
    };
  }
}
