import { BaseRepository } from './base-repository';
import { CategoryEntity, CategoryType } from '../entities/category.entity';
import { EntityManager } from 'typeorm';
export class CategoryRepository extends BaseRepository<CategoryEntity> {
  constructor(manager?: EntityManager) {
    super(CategoryEntity, manager);
  }
  async findById(id: number, userId: number): Promise<CategoryEntity | null> {
    return await this.findOne({
      where: [
        { id, userId },
        { id, isDefault: true },
      ],
    });
  }
  async findAllByUserId(userId: number): Promise<CategoryEntity[]> {
    return await this.find({
      where: [{ userId }, { isDefault: true }],
      order: { name: 'ASC' },
    });
  }
  async findByType(
    userId: number,
    type: CategoryType,
  ): Promise<CategoryEntity[]> {
    return await this.find({
      where: [
        { userId, type },
        { isDefault: true, type },
      ],
      order: { name: 'ASC' },
    });
  }
  async findDefaultCategories(): Promise<CategoryEntity[]> {
    return await this.find({
      where: { isDefault: true },
      order: { name: 'ASC' },
    });
  }
  async findUserCategories(userId: number): Promise<CategoryEntity[]> {
    return await this.find({
      where: { userId, isDefault: false },
      order: { name: 'ASC' },
    });
  }
  async findByName(
    userId: number,
    name: string,
  ): Promise<CategoryEntity | null> {
    return await this.findOne({
      where: [
        { userId, name },
        { isDefault: true, name },
      ],
    });
  }
  async createCategory(
    categoryData: Partial<CategoryEntity> & { userId: number },
  ): Promise<CategoryEntity> {
    return await this.save({
      ...categoryData,
      isDefault: categoryData.isDefault ?? false,
    });
  }
  async createDefaultCategory(
    categoryData: Partial<CategoryEntity>,
  ): Promise<CategoryEntity> {
    return await this.save({
      ...categoryData,
      userId: undefined,
      isDefault: true,
    });
  }
  async updateCategory(
    id: number,
    userId: number,
    categoryData: Partial<CategoryEntity>,
  ): Promise<CategoryEntity | null> {
    await this.update({ id, userId, isDefault: false }, categoryData);
    return await this.findById(id, userId);
  }
  async deleteCategory(id: number, userId: number): Promise<void> {
    await this.delete({ id, userId, isDefault: false });
  }
  async nameExists(
    userId: number,
    name: string,
    excludeId?: number,
  ): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('category')
      .where('category.name = :name', { name })
      .andWhere(
        '(category.user_id = :userId OR category.is_default = :isDefault)',
        { userId, isDefault: true },
      );
    if (excludeId) {
      query.andWhere('category.id != :excludeId', { excludeId });
    }
    const count = await query.getCount();
    return count > 0;
  }
  async hasDefaultCategories(): Promise<boolean> {
    const count = await this.count({ isDefault: true });
    return count > 0;
  }
}
