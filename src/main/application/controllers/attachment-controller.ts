import { AttachmentService } from '../services/attachment-service';
import type {
  Attachment,
  CreateAttachmentInput,
  AttachmentUploadResult,
} from '@shared/interfaces/types/attachment.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class AttachmentController extends BaseHandler {
  private _attachmentService: AttachmentService | null = null;

  private get attachmentService(): AttachmentService {
    if (!this._attachmentService) {
      this._attachmentService = new AttachmentService();
    }
    return this._attachmentService;
  }

  @IpcMethod('attachment:upload')
  async upload(
    data: CreateAttachmentInput,
  ): Promise<ApiResponse<AttachmentUploadResult>> {
    return wrap(async () => {
      return await this.attachmentService.upload(data);
    })();
  }

  @IpcMethod('attachment:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.attachmentService.delete(id);
    })();
  }

  @IpcMethod('attachment:findByTransaction')
  async findByTransaction(
    transactionId: number,
  ): Promise<ApiResponse<Attachment[]>> {
    return wrap(async () => {
      return await this.attachmentService.findByTransaction(transactionId);
    })();
  }

  @IpcMethod('attachment:getFile')
  async getFile(
    id: number,
  ): Promise<
    ApiResponse<{ buffer: Buffer; mimeType: string; filename: string } | null>
  > {
    return wrap(async () => {
      return await this.attachmentService.getFileBuffer(id);
    })();
  }
}
