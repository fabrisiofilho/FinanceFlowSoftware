import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
import { FinanceAuthService } from '../services/finance-auth-service';
import { OnboardingService } from '../services/onboarding-service';
export class OnboardingController extends BaseHandler {
  private actor(): number {
    const id = FinanceAuthService.getInstance().getCurrentUserId();
    if (!id) throw new Error('Usuário não autenticado');
    return id;
  }
  @IpcMethod('onboarding:state') state() {
    return wrap(() => new OnboardingService().state(this.actor()))();
  }
  @IpcMethod('onboarding:advance') advance(step: number, skip = false) {
    return wrap(() =>
      new OnboardingService().advance(this.actor(), step, skip),
    )();
  }
}
