import { ICategoryController } from '@shared/interfaces/controllers/category.controller.interface';
import { CategoryService } from '../services/category-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Category,
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@shared/interfaces/types/category.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class CategoryController
  extends BaseHandler
  implements ICategoryController
{
  private _categoryService: CategoryService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get categoryService(): CategoryService {
    if (!this._categoryService) {
      this._categoryService = new CategoryService();
    }
    return this._categoryService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('category:create')
  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.categoryService.create(userId, data);
    })();
  }
  @IpcMethod('category:update')
  async update(
    id: number,
    data: UpdateCategoryInput,
  ): Promise<ApiResponse<Category>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.categoryService.update(userId, id, data);
    })();
  }
  @IpcMethod('category:delete')
  async delete(id: number, replacementId?: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.categoryService.delete(userId, id, replacementId);
    })();
  }
  @IpcMethod('category:findById')
  async findById(id: number): Promise<ApiResponse<Category>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const category = await this.categoryService.findById(userId, id);
      if (!category) {
        throw new Error('Categoria não encontrada');
      }
      return category;
    })();
  }
  @IpcMethod('category:findAll')
  async findAll(): Promise<ApiResponse<Category[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.categoryService.findAll(userId);
    })();
  }
  @IpcMethod('category:findByType')
  async findByType(type: CategoryType): Promise<ApiResponse<Category[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.categoryService.findByType(userId, type);
    })();
  }
  @IpcMethod('category:initializeDefaults')
  async initializeDefaults(): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.categoryService.initializeDefaults();
    })();
  }
}
