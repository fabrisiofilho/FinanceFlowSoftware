import { requireTransactionOwner } from './ownership';
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

  constructor(directory?: string) {
    this.attachmentsDir =
      directory ?? path.join(app.getPath('userData'), 'attachments');
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

  async upload(
    userId: number,
    data: CreateAttachmentInput,
  ): Promise<AttachmentUploadResult> {
    logger.info('Uploading attachment for transaction:', data.transactionId);

    await requireTransactionOwner(userId, data.transactionId);
    let pendingFile: string | undefined;
    try {
      // Validate file
      if (
        !ALLOWED_MIME_TYPES.some((mimeType) => mimeType === data.file.mimeType)
      ) {
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
      pendingFile = filePath;

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
      pendingFile = undefined;
      logger.success('Attachment uploaded:', saved.id);

      return {
        success: true,
        attachment: this.mapEntityToAttachment(saved),
      };
    } catch (error) {
      if (pendingFile && fs.existsSync(pendingFile)) fs.unlinkSync(pendingFile);
      logger.error('Error uploading attachment:', error);
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  private validatePath(file: string): void {
    const resolved = path.resolve(file);
    if (path.dirname(resolved) !== path.resolve(this.attachmentsDir))
      throw new Error('Local do anexo inválido.');
  }
  async delete(userId: number, id: number): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new Error('Anexo não encontrado');
    }

    await requireTransactionOwner(userId, attachment.transactionId);
    this.validatePath(attachment.filePath);
    if (attachment.thumbnailPath) this.validatePath(attachment.thumbnailPath);
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

  async findById(userId: number, id: number): Promise<Attachment | null> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (attachment)
      await requireTransactionOwner(userId, attachment.transactionId);
    return attachment ? this.mapEntityToAttachment(attachment) : null;
  }

  async findByTransaction(
    userId: number,
    transactionId: number,
  ): Promise<Attachment[]> {
    await requireTransactionOwner(userId, transactionId);
    const attachments = await this.attachmentRepository.find({
      where: { transactionId },
      order: { createdAt: 'DESC' },
    });

    return attachments.map((a) => this.mapEntityToAttachment(a));
  }

  async getFileBuffer(
    userId: number,
    id: number,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (attachment)
      await requireTransactionOwner(userId, attachment.transactionId);
    if (!attachment || !fs.existsSync(attachment.filePath)) {
      return null;
    }

    this.validatePath(attachment.filePath);
    return {
      buffer: fs.readFileSync(attachment.filePath),
      mimeType: attachment.mimeType,
      filename: attachment.originalName,
    };
  }

  async deleteByTransaction(
    userId: number,
    transactionId: number,
  ): Promise<void> {
    await requireTransactionOwner(userId, transactionId);
    const attachments = await this.attachmentRepository.find({
      where: { transactionId },
    });

    for (const attachment of attachments) {
      this.validatePath(attachment.filePath);
      if (attachment.thumbnailPath) this.validatePath(attachment.thumbnailPath);
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

  async getTotalSize(userId: number, transactionId?: number): Promise<number> {
    const query = this.attachmentRepository
      .createQueryBuilder('a')
      .innerJoin('a.transaction', 't')
      .innerJoin('t.account', 'account')
      .where('account.user_id=:userId', { userId })
      .select('SUM(a.file_size)', 'total');

    if (transactionId) {
      query.andWhere('a.transaction_id = :transactionId', { transactionId });
    }

    const result = await query.getRawOne();
    return Number(result?.total ?? 0);
  }
}
