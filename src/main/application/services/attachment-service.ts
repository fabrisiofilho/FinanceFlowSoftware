import { logger } from '@main/infrastructure/log/logger';
import { getDataSource } from '@main/infrastructure/database/data-source';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AttachmentEntity } from '../entities/attachment.entity';
import {
  Attachment,
  CreateAttachmentInput,
  AttachmentUploadResult,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@shared/interfaces/types/attachment.types';

export class AttachmentService {
  private attachmentsDir: string;

  constructor() {
    this.attachmentsDir = path.join(app.getPath('userData'), 'attachments');
    this.ensureAttachmentsDir();
  }

  private get attachmentRepository() {
    return getDataSource().getRepository(AttachmentEntity);
  }

  private ensureAttachmentsDir(): void {
    if (!fs.existsSync(this.attachmentsDir)) {
      fs.mkdirSync(this.attachmentsDir, { recursive: true });
    }
  }

  private mapEntityToAttachment(entity: AttachmentEntity): Attachment {
    return {
      id: entity.id,
      transactionId: entity.transactionId,
      filename: entity.filename,
      originalName: entity.originalName,
      mimeType: entity.mimeType,
      fileSize: entity.fileSize,
      filePath: entity.filePath,
      thumbnailPath: entity.thumbnailPath,
      createdAt: entity.createdAt,
    };
  }

  async upload(data: CreateAttachmentInput): Promise<AttachmentUploadResult> {
    logger.info('Uploading attachment for transaction:', data.transactionId);

    try {
      // Validate file
      if (!ALLOWED_MIME_TYPES.includes(data.file.mimeType as any)) {
        return {
          success: false,
          errorMessage: `Tipo de arquivo não permitido: ${data.file.mimeType}`,
        };
      }

      if (data.file.buffer.length > MAX_FILE_SIZE) {
        return {
          success: false,
          errorMessage: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
      }

      // Generate unique filename
      const ext = path.extname(data.file.originalName);
      const hash = crypto.randomBytes(16).toString('hex');
      const filename = `${data.transactionId}_${hash}${ext}`;
      const filePath = path.join(this.attachmentsDir, filename);

      // Save file
      fs.writeFileSync(filePath, data.file.buffer);

      // Create database record
      const attachment = this.attachmentRepository.create({
        transactionId: data.transactionId,
        filename,
        originalName: data.file.originalName,
        mimeType: data.file.mimeType,
        fileSize: data.file.buffer.length,
        filePath,
      });

      const saved = await this.attachmentRepository.save(attachment);
      logger.success('Attachment uploaded:', saved.id);

      return {
        success: true,
        attachment: this.mapEntityToAttachment(saved),
      };
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  async delete(id: number): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new Error('Anexo não encontrado');
    }

    // Delete file from disk
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    if (attachment.thumbnailPath && fs.existsSync(attachment.thumbnailPath)) {
      fs.unlinkSync(attachment.thumbnailPath);
    }

    // Delete database record
    await this.attachmentRepository.remove(attachment);
    logger.success('Attachment deleted:', id);
  }

  async findById(id: number): Promise<Attachment | null> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    return attachment ? this.mapEntityToAttachment(attachment) : null;
  }

  async findByTransaction(transactionId: number): Promise<Attachment[]> {
    const attachments = await this.attachmentRepository.find({
      where: { transactionId },
      order: { createdAt: 'DESC' },
    });

    return attachments.map((a) => this.mapEntityToAttachment(a));
  }

  async getFileBuffer(
    id: number,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment || !fs.existsSync(attachment.filePath)) {
      return null;
    }

    return {
      buffer: fs.readFileSync(attachment.filePath),
      mimeType: attachment.mimeType,
      filename: attachment.originalName,
    };
  }

  async deleteByTransaction(transactionId: number): Promise<void> {
    const attachments = await this.attachmentRepository.find({
      where: { transactionId },
    });

    for (const attachment of attachments) {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
      if (attachment.thumbnailPath && fs.existsSync(attachment.thumbnailPath)) {
        fs.unlinkSync(attachment.thumbnailPath);
      }
    }

    await this.attachmentRepository.delete({ transactionId });
    logger.info(
      `Deleted ${attachments.length} attachments for transaction ${transactionId}`,
    );
  }

  async getTotalSize(transactionId?: number): Promise<number> {
    const query = this.attachmentRepository
      .createQueryBuilder('a')
      .select('SUM(a.file_size)', 'total');

    if (transactionId) {
      query.where('a.transaction_id = :transactionId', { transactionId });
    }

    const result = await query.getRawOne();
    return Number(result?.total ?? 0);
  }
}
