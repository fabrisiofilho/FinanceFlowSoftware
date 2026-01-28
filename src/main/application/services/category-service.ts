import { CategoryEntity, CategoryType } from '../entities/category.entity';
import { logger } from '@main/infrastructure/log/logger';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@shared/interfaces/types/category.types';
import { repositoryCache } from '../repositories/repository-cache';
const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: CategoryType;
  icon?: string;
}> = [
  { name: 'Moradia', type: 'expense', icon: 'home' },
  { name: 'Alimentação', type: 'expense', icon: 'restaurant' },
  { name: 'Transporte', type: 'expense', icon: 'directions_car' },
  { name: 'Lazer', type: 'expense', icon: 'sports_esports' },
  { name: 'Saúde', type: 'expense', icon: 'local_hospital' },
  { name: 'Educação', type: 'expense', icon: 'school' },
  { name: 'Salário', type: 'income', icon: 'payments' },
  { name: 'Investimentos', type: 'income', icon: 'trending_up' },
  { name: 'Freelas', type: 'income', icon: 'work' },
  { name: 'Outros', type: 'expense', icon: 'more_horiz' },
];
export class CategoryService {
  constructor() {}
  private get categoryRepository() {
    return repositoryCache.categoryRepository;
  }
  private get transactionRepository() {
    return repositoryCache.transactionRepository;
  }
  private mapEntityToCategory(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type as CategoryType,
      icon: entity.icon ?? undefined,
      isDefault: entity.isDefault,
    };
  }
  private validateCreateInput(data: CreateCategoryInput): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da categoria é obrigatório');
    }
    if (!data.type) {
      throw new Error('Tipo da categoria é obrigatório');
    }
    const validTypes: CategoryType[] = ['income', 'expense'];
    if (!validTypes.includes(data.type)) {
      throw new Error('Tipo de categoria inválido');
    }
  }
  private validateUpdateInput(data: UpdateCategoryInput): void {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da categoria não pode ser vazio');
    }
  }
  async initializeDefaults(): Promise<void> {
    logger.info('Verificando categorias padrão do sistema');
    const hasDefaults = await this.categoryRepository.hasDefaultCategories();
    if (hasDefaults) {
      logger.info('Categorias padrão já existem');
      return;
    }
    logger.info('Criando categorias padrão do sistema');
    for (const categoryData of DEFAULT_CATEGORIES) {
      await this.categoryRepository.createDefaultCategory({
        name: categoryData.name,
        type: categoryData.type,
        icon: categoryData.icon,
      });
    }
    logger.success('Categorias padrão criadas com sucesso');
  }
  async create(userId: number, data: CreateCategoryInput): Promise<Category> {
    logger.info('Criando nova categoria para usuário:', userId);
    this.validateCreateInput(data);
    const nameExists = await this.categoryRepository.nameExists(
      userId,
      data.name.trim(),
    );
    if (nameExists) {
      throw new Error('Já existe uma categoria com este nome');
    }
    const categoryEntity = await this.categoryRepository.createCategory({
      userId,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon,
    });
    logger.success('Categoria criada com sucesso:', categoryEntity.name);
    return this.mapEntityToCategory(categoryEntity);
  }
  async update(
    userId: number,
    id: number,
    data: UpdateCategoryInput,
  ): Promise<Category> {
    logger.info('Atualizando categoria:', id);
    const existingCategory = await this.categoryRepository.findById(id, userId);
    if (!existingCategory) {
      throw new Error('Categoria não encontrada');
    }
    if (existingCategory.isDefault) {
      throw new Error('Categorias padrão não podem ser editadas');
    }
    this.validateUpdateInput(data);
    if (data.name !== undefined) {
      const nameExists = await this.categoryRepository.nameExists(
        userId,
        data.name.trim(),
        id,
      );
      if (nameExists) {
        throw new Error('Já existe uma categoria com este nome');
      }
    }
    const updateData: Partial<CategoryEntity> = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }
    const updatedEntity = await this.categoryRepository.updateCategory(
      id,
      userId,
      updateData,
    );
    if (!updatedEntity) {
      throw new Error('Erro ao atualizar categoria');
    }
    logger.success('Categoria atualizada com sucesso:', updatedEntity.name);
    return this.mapEntityToCategory(updatedEntity);
  }
  async delete(
    userId: number,
    id: number,
    replacementCategoryId?: number,
  ): Promise<void> {
    logger.info('Excluindo categoria:', id);
    const existingCategory = await this.categoryRepository.findById(id, userId);
    if (!existingCategory) {
      throw new Error('Categoria não encontrada');
    }
    if (existingCategory.isDefault) {
      throw new Error('Categorias padrão não podem ser excluídas');
    }
    const transactionCount =
      await this.transactionRepository.countByCategory(id);
    if (transactionCount > 0) {
      if (!replacementCategoryId) {
        throw new Error(
          `Não é possível excluir categoria com transações vinculadas. ` +
            `Existem ${transactionCount} transação(ões) vinculada(s). ` +
            `Forneça uma categoria substituta.`,
        );
      }
      const replacementCategory = await this.categoryRepository.findById(
        replacementCategoryId,
        userId,
      );
      if (!replacementCategory) {
        throw new Error('Categoria substituta não encontrada');
      }
      if (replacementCategory.type !== existingCategory.type) {
        throw new Error(
          'A categoria substituta deve ser do mesmo tipo (receita/despesa)',
        );
      }
      if (replacementCategoryId === id) {
        throw new Error(
          'A categoria substituta não pode ser a mesma categoria a ser excluída',
        );
      }
      logger.info(
        `Migrando ${transactionCount} transações para categoria ${replacementCategoryId}`,
      );
      await this.transactionRepository.updateCategoryForTransactions(
        id,
        replacementCategoryId,
      );
    }
    await this.categoryRepository.deleteCategory(id, userId);
    logger.success('Categoria excluída com sucesso:', existingCategory.name);
  }
  async findById(userId: number, id: number): Promise<Category | null> {
    const categoryEntity = await this.categoryRepository.findById(id, userId);
    if (!categoryEntity) {
      return null;
    }
    return this.mapEntityToCategory(categoryEntity);
  }
  async findAll(userId: number): Promise<Category[]> {
    const categories = await this.categoryRepository.findAllByUserId(userId);
    return categories.map((entity) => this.mapEntityToCategory(entity));
  }
  async findByType(userId: number, type: CategoryType): Promise<Category[]> {
    const categories = await this.categoryRepository.findByType(userId, type);
    return categories.map((entity) => this.mapEntityToCategory(entity));
  }
  async findDefaults(): Promise<Category[]> {
    const categories = await this.categoryRepository.findDefaultCategories();
    return categories.map((entity) => this.mapEntityToCategory(entity));
  }
  async findUserCategories(userId: number): Promise<Category[]> {
    const categories = await this.categoryRepository.findUserCategories(userId);
    return categories.map((entity) => this.mapEntityToCategory(entity));
  }
  async exists(userId: number, id: number): Promise<boolean> {
    const category = await this.categoryRepository.findById(id, userId);
    return category !== null;
  }
  async countLinkedTransactions(categoryId: number): Promise<number> {
    return await this.transactionRepository.countByCategory(categoryId);
  }
}
