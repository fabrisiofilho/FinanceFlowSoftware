import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
import { ExternalDataService } from '../services/external-data-service';
export class ExternalDataController extends BaseHandler {
  private service = new ExternalDataService();
  @IpcMethod('externalData:snapshot') snapshot(refresh = false) {
    return wrap(() => this.service.snapshot(refresh))();
  }
}
