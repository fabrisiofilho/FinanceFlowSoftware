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
    transactionId: number,
    tagId: number,
  ): Promise<void> {
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
    transactionId: number,
    tagId: number,
  ): Promise<void> {
    await this.transactionTagRepository.delete({ transactionId, tagId });
    logger.info(`Tag ${tagId} removida da transação ${transactionId}`);
  }

  async getTransactionTags(transactionId: number): Promise<TransactionTag[]> {
    const transactionTags = await this.transactionTagRepository.find({
      where: { transactionId },
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
    transactionId: number,
    tagIds: number[],
  ): Promise<void> {
    // Remove existing tags
    await this.transactionTagRepository.delete({ transactionId });

    // Add new tags
    for (const tagId of tagIds) {
      await this.addTagToTransaction(transactionId, tagId);
    }
  }

  async findTransactionsByTag(
    userId: number,
    tagId: number,
  ): Promise<number[]> {
    const transactionTags = await this.transactionTagRepository
      .createQueryBuilder('tt')
      .innerJoin('tt.tag', 'tag')
      .where('tag.user_id = :userId', { userId })
      .andWhere('tt.tag_id = :tagId', { tagId })
      .getMany();

    return transactionTags.map((tt) => tt.transactionId);
  }
}
