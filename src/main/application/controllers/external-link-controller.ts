import { shell } from 'electron';
import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
export class ExternalLinkController extends BaseHandler {
  @IpcMethod('app:openExternal') openExternal(value: unknown) {
    return wrap(async () => {
      if (typeof value !== 'string' || value.length > 2048)
        throw new Error('Endereço inválido.');
      const url = new URL(value);
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error('Somente links HTTP ou HTTPS são permitidos.');
      await shell.openExternal(url.toString());
    })();
  }
}
