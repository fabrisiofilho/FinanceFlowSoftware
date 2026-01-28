import { IGoalController } from '@shared/interfaces/controllers/goal.controller.interface';
import { GoalService } from '../services/goal-service';
import { FinanceAuthService } from '../services/finance-auth-service';
import type {
  Goal,
  GoalProgress,
  CreateGoalInput,
  UpdateGoalInput,
  AddContributionInput,
} from '@shared/interfaces/types/goal.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class GoalController extends BaseHandler implements IGoalController {
  private _goalService: GoalService | null = null;
  private financeAuthService = FinanceAuthService.getInstance();
  private get goalService(): GoalService {
    if (!this._goalService) {
      this._goalService = new GoalService();
    }
    return this._goalService;
  }
  private getUserId(): number {
    const userId = this.financeAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return userId;
  }
  @IpcMethod('goal:create')
  async create(data: CreateGoalInput): Promise<ApiResponse<Goal>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.goalService.create(userId, data);
    })();
  }
  @IpcMethod('goal:update')
  async update(id: number, data: UpdateGoalInput): Promise<ApiResponse<Goal>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.goalService.update(userId, id, data);
    })();
  }
  @IpcMethod('goal:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      const userId = this.getUserId();
      await this.goalService.delete(userId, id);
    })();
  }
  @IpcMethod('goal:findById')
  async findById(id: number): Promise<ApiResponse<Goal>> {
    return wrap(async () => {
      const userId = this.getUserId();
      const goal = await this.goalService.findById(userId, id);
      if (!goal) {
        throw new Error('Meta não encontrada');
      }
      return goal;
    })();
  }
  @IpcMethod('goal:findAll')
  async findAll(): Promise<ApiResponse<Goal[]>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.goalService.findAll(userId);
    })();
  }
  @IpcMethod('goal:addContribution')
  async addContribution(
    id: number,
    data: AddContributionInput,
  ): Promise<ApiResponse<Goal>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.goalService.addContribution(userId, id, data);
    })();
  }
  @IpcMethod('goal:getProgress')
  async getProgress(id: number): Promise<ApiResponse<GoalProgress>> {
    return wrap(async () => {
      const userId = this.getUserId();
      return await this.goalService.getProgress(userId, id);
    })();
  }
}
