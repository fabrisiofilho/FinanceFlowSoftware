import { requireTransactionOwner } from './ownership';
import { financialTransaction } from '@main/infrastructure/database/financial-transaction';
import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { TagEntity } from '../entities/tag.entity';
import { TransactionTagEntity } from '../entities/transaction-tag.entity';
import {
  Tag,
  CreateTagInput,
  UpdateTagInput,
  TransactionTag,
} from '@shared/interfaces/types/tag.types';

export class TagService {
  private get tagRepository() {
    return getDataSource().getRepository(TagEntity);
  }

  private get transactionTagRepository() {
    return getDataSource().getRepository(TransactionTagEntity);
  }

  private mapEntityToTag(entity: TagEntity): Tag {
    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      color: entity.color,
      createdAt: entity.createdAt,
    };
  }

  async create(userId: number, data: CreateTagInput): Promise<Tag> {
    logger.info('Criando tag para usuário:', userId);

    const existing = await this.tagRepository.findOne({
      where: { userId, name: data.name },
    });

    if (existing) {
      throw new Error('Já existe uma tag com este nome');
    }

    const tag = this.tagRepository.create({
      userId,
      name: data.name,
      color: data.color ?? '#6366f1',
    });

    const saved = await this.tagRepository.save(tag);
    logger.success('Tag criada:', saved.id);

    return this.mapEntityToTag(saved);
  }

  async update(userId: number, id: number, data: UpdateTagInput): Promise<Tag> {
    logger.info('Atualizando tag:', id);

    const tag = await this.tagRepository.findOne({
      where: { id, userId },
    });

    if (!tag) {
      throw new Error('Tag não encontrada');
    }

    if (data.name) {
      const existing = await this.tagRepository.findOne({
        where: { userId, name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new Error('Já existe uma tag com este nome');
      }
      tag.name = data.name;
    }

    if (data.color) {
      tag.color = data.color;
    }

    const saved = await this.tagRepository.save(tag);
    return this.mapEntityToTag(saved);
  }

  async delete(userId: number, id: number): Promise<void> {
    const tag = await this.tagRepository.findOne({
      where: { id, userId },
    });

    if (!tag) {
      throw new Error('Tag não encontrada');
    }

    await this.tagRepository.remove(tag);
    logger.success('Tag excluída:', id);
  }

  async findById(userId: number, id: number): Promise<Tag | null> {
    const tag = await this.tagRepository.findOne({
      where: { id, userId },
    });

    return tag ? this.mapEntityToTag(tag) : null;
  }

  async findAll(userId: number): Promise<Tag[]> {
    const tags = await this.tagRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    return tags.map((t) => this.mapEntityToTag(t));
  }

  async addTagToTransaction(
    userId: number,
    transactionId: number,
    tagId: number,
  ): Promise<void> {
    await requireTransactionOwner(userId, transactionId);
    if (!(await this.findById(userId, tagId)))
      throw new Error('Tag não encontrada');
    const existing = await this.transactionTagRepository.findOne({
      where: { transactionId, tagId },
    });

    if (existing) {
      return; // Already tagged
    }

    const transactionTag = this.transactionTagRepository.create({
      transactionId,
      tagId,
    });

    await this.transactionTagRepository.save(transactionTag);
    logger.info(`Tag ${tagId} adicionada à transação ${transactionId}`);
  }

  async removeTagFromTransaction(
    userId: number,
    transactionId: number,
    tagId: number,
  ): Promise<void> {
    await requireTransactionOwner(userId, transactionId);
    await this.transactionTagRepository.delete({ transactionId, tagId });
    logger.info(`Tag ${tagId} removida da transação ${transactionId}`);
  }

  async getTransactionTags(
    userId: number,
    transactionId: number,
  ): Promise<TransactionTag[]> {
    await requireTransactionOwner(userId, transactionId);
    const transactionTags = await this.transactionTagRepository.find({
      where: { transactionId, tag: { userId } },
      relations: ['tag'],
    });

    return transactionTags.map((tt) => ({
      transactionId: tt.transactionId,
      tagId: tt.tagId,
      tagName: (tt.tag as TagEntity).name,
      tagColor: (tt.tag as TagEntity).color,
    }));
  }

  async setTransactionTags(
    userId: number,
    transactionId: number,
    tagIds: number[],
  ): Promise<void> {
    await requireTransactionOwner(userId, transactionId);
    if (!Array.isArray(tagIds) || tagIds.length > 100)
      throw new Error('Tags inválidas');
    for (const id of tagIds)
      if (!(await this.findById(userId, id)))
        throw new Error('Tag não encontrada');
    await financialTransaction(async (manager) => {
      const repository = manager.getRepository(TransactionTagEntity);
      await repository.delete({ transactionId });
      for (const tagId of new Set(tagIds))
        await repository.save({ transactionId, tagId });
    });
  }

  async findTransactionsByTag(
    userId: number,
    tagId: number,
  ): Promise<number[]> {
    const transactionTags = await this.transactionTagRepository
      .createQueryBuilder('tt')
      .innerJoin('tt.tag', 'tag')
      .innerJoin('tt.transaction', 'entry')
      .innerJoin('entry.account', 'account')
      .where('tag.user_id = :userId', { userId })
      .andWhere('tt.tag_id = :tagId', { tagId })
      .andWhere('account.user_id=:userId', { userId })
      .getMany();

    return transactionTags.map((tt) => tt.transactionId);
  }
}
