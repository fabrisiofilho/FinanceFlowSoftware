import { TagService } from '../services/tag-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Tag,
  CreateTagInput,
  UpdateTagInput,
  TransactionTag,
} from '@shared/interfaces/types/tag.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class TagController extends BaseHandler {
  private _tagService: TagService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();

  private get tagService(): TagService {
    if (!this._tagService) {
      this._tagService = new TagService();
    }
    return this._tagService;
  }

  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }

  @IpcMethod('tag:create')
  async create(data: CreateTagInput): Promise<ApiResponse<Tag>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.tagService.create(userId, data);
    })();
  }

  @IpcMethod('tag:update')
  async update(id: number, data: UpdateTagInput): Promise<ApiResponse<Tag>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.tagService.update(userId, id, data);
    })();
  }

  @IpcMethod('tag:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.tagService.delete(userId, id);
    })();
  }

  @IpcMethod('tag:findAll')
  async findAll(): Promise<ApiResponse<Tag[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.tagService.findAll(userId);
    })();
  }

  @IpcMethod('tag:getTransactionTags')
  async getTransactionTags(
    transactionId: number,
  ): Promise<ApiResponse<TransactionTag[]>> {
    return wrap(async () => {
      return await this.tagService.getTransactionTags(transactionId);
    })();
  }

  @IpcMethod('tag:setTransactionTags')
  async setTransactionTags(
    transactionId: number,
    tagIds: number[],
  ): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.tagService.setTransactionTags(transactionId, tagIds);
    })();
  }
}
