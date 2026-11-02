import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { FinanceAuthService } from '../services/finance-auth-service';
import { ListingService } from '../services/listing-service';
import type { ListingQuery } from '@shared/interfaces/types/listing.types';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class ListingController extends BaseHandler {
  @IpcMethod('listing:query')
  query(input: ListingQuery) {
    return wrap(async () => {
      const user = FinanceAuthService.getInstance().getCurrentUserId();
      if (!user) throw new Error('Usuário não autenticado');
      return new ListingService().query(user, input);
    })();
  }
}
