import { FinanceAuthService } from '../services/finance-auth-service';
import { AttachmentService } from '../services/attachment-service';
import type {
  Attachment,
  AttachmentUploadResult,
} from '@shared/interfaces/types/attachment.types';
import type { ApiResponse } from '@shared/interfaces/types/common.types';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { BaseHandler } from './config/base-handler';
import { wrap } from '@main/infrastructure/utils/try-catch';

export class AttachmentController extends BaseHandler {
  private getUserId(): number {
    const userId = FinanceAuthService.getInstance().getCurrentUserId();
    if (!userId) throw new Error('Usuário não autenticado');
    return userId;
  }
  private _attachmentService: AttachmentService | null = null;

  private get attachmentService(): AttachmentService {
    if (!this._attachmentService) {
      this._attachmentService = new AttachmentService();
    }
    return this._attachmentService;
  }

  @IpcMethod('attachment:upload')
  async upload(
    transactionId: number,
    fileData: { buffer: ArrayBuffer; originalName: string; mimeType: string },
  ): Promise<ApiResponse<AttachmentUploadResult>> {
    return wrap(async () => {
      return await this.attachmentService.upload(this.getUserId(), {
        transactionId,
        file: { ...fileData, buffer: Buffer.from(fileData.buffer) },
      });
    })();
  }

  @IpcMethod('attachment:delete')
  async delete(id: number): Promise<ApiResponse<void>> {
    return wrap(async () => {
      await this.attachmentService.delete(this.getUserId(), id);
    })();
  }

  @IpcMethod('attachment:findByTransaction')
  async findByTransaction(
    transactionId: number,
  ): Promise<ApiResponse<Attachment[]>> {
    return wrap(async () => {
      return await this.attachmentService.findByTransaction(
        this.getUserId(),
        transactionId,
      );
    })();
  }

  @IpcMethod('attachment:getFile')
  async getFile(id: number): Promise<
    ApiResponse<{
      data: ArrayBuffer;
      mimeType: string;
      filename: string;
    } | null>
  > {
    return wrap(async () => {
      const file = await this.attachmentService.getFileBuffer(
        this.getUserId(),
        id,
      );
      return file
        ? {
            data: Uint8Array.from(file.buffer).buffer,
            mimeType: file.mimeType,
            filename: file.filename,
          }
        : null;
    })();
  }
}
