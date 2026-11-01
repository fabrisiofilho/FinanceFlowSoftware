import type { EntityManager } from 'typeorm';
import { CategoryEntity, type CategoryType } from '../entities/category.entity';

/** Usa a mesma transação da transferência para não deixar categorias órfãs. */
export class TransferCategoryService {
  async getOrCreate(
    manager: EntityManager,
    userId: number,
    type: CategoryType,
  ): Promise<number> {
    const repository = manager.getRepository(CategoryEntity);
    const name = 'Transferência entre contas';
    const existing = await repository.findOne({
      where: { userId, name, type },
    });
    if (existing) return existing.id;
    const category = await repository.save(
      repository.create({ userId, name, type, isDefault: false }),
    );
    return category.id;
  }
}
