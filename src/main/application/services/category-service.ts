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
  { name: 'Moradia', type: 'expense', icon: 'Home' },
  { name: 'Alimentação', type: 'expense', icon: 'Restaurant' },
  { name: 'Transporte', type: 'expense', icon: 'DirectionsCar' },
  { name: 'Lazer', type: 'expense', icon: 'SportsEsports' },
  { name: 'Saúde', type: 'expense', icon: 'LocalHospital' },
  { name: 'Educação', type: 'expense', icon: 'School' },
  { name: 'Salário', type: 'income', icon: 'Payments' },
  { name: 'Investimentos', type: 'income', icon: 'TrendingUp' },
  { name: 'Freelas', type: 'income', icon: 'Work' },
  { name: 'Outros', type: 'expense', icon: 'MoreHoriz' },
];
export class CategoryService {
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
    const existing = await this.categoryRepository.findDefaultCategories();
    for (const category of DEFAULT_CATEGORIES) {
      const found = existing.find(
        (item) => item.name === category.name && item.type === category.type,
      );
      if (!found) await this.categoryRepository.createDefaultCategory(category);
      else if (
        !found.icon ||
        found.icon.includes('_') ||
        found.icon[0] === found.icon[0].toLowerCase()
      ) {
        await this.categoryRepository.update(
          { id: found.id },
          { icon: category.icon },
        );
      }
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
