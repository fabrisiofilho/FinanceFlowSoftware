import { embedAttachments, restoreAttachments } from './backup-attachments';
import { serializeFinancialOperation } from '@main/infrastructure/database/financial-transaction';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import { encryptBackup, decryptBackup } from '../../../domain/backup-codec';
import {
  getDataSource,
  getDatabasePath,
  closeDatabase,
  initializeDatabase,
} from '@main/infrastructure/database/data-source';

/** Snapshot completo, incluindo todos os perfis locais. Caminhos vêm apenas dos diálogos nativos. */
export class BackupService {
  constructor(private readonly attachmentsDirectory?: string) {}
  async export(file: string, password: string): Promise<void> {
    return serializeFinancialOperation(() =>
      this.exportSnapshot(file, password),
    );
  }
  private async exportSnapshot(file: string, password: string): Promise<void> {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'contabily-backup-'),
    );
    const snapshot = path.join(directory, 'snapshot.sqlite');
    try {
      await getDataSource().query('VACUUM INTO ?', [snapshot]);
      const contents = new Database(snapshot);
      try {
        embedAttachments(contents, this.attachmentsDirectory);
      } finally {
        contents.close();
      }
      const encoded = encryptBackup(fs.readFileSync(snapshot), password);
      fs.writeFileSync(file, encoded, { encoding: 'utf8', mode: 0o600 });
    } finally {
      if (fs.existsSync(snapshot)) fs.unlinkSync(snapshot);
      fs.rmdirSync(directory);
    }
  }
  async restore(file: string, password: string): Promise<void> {
    return serializeFinancialOperation(() =>
      this.restoreSnapshot(file, password),
    );
  }
  private async restoreSnapshot(file: string, password: string): Promise<void> {
    if (fs.statSync(file).size > 384 * 1024 * 1024)
      throw new Error('Backup muito grande.');
    const bytes = decryptBackup(fs.readFileSync(file, 'utf8'), password);
    const active = getDatabasePath();
    const staged = active + '.restore-' + Date.now();
    const safety = active + '.before-restore-' + Date.now();
    fs.writeFileSync(staged, bytes, { mode: 0o600 });
    let closed = false;
    let restoredFiles: string[] = [];
    try {
      const candidate = new Database(staged, {
        readonly: false,
        fileMustExist: true,
      });
      try {
        if (
          candidate.pragma('user_version', { simple: true }) !== 3 ||
          candidate.pragma('integrity_check', { simple: true }) !== 'ok' ||
          (candidate.pragma('foreign_key_check') as unknown[]).length
        )
          throw new Error('Backup com inconsistências.');
        const tables = candidate
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all() as { name: string }[];
        if (
          ![
            'migrations',
            'finance_users',
            'accounts',
            'transactions',
            'investments',
            'investment_events',
          ].every((name) => tables.some((table) => table.name === name))
        )
          throw new Error('Backup não pertence a esta versão do Contabily.');
        restoredFiles = restoreAttachments(
          candidate,
          this.attachmentsDirectory,
        );
      } finally {
        candidate.close();
      }
      await closeDatabase();
      closed = true;
      if (fs.existsSync(active)) fs.renameSync(active, safety);
      try {
        for (const suffix of ['-wal', '-shm'])
          if (fs.existsSync(active + suffix)) fs.unlinkSync(active + suffix);
        fs.renameSync(staged, active);
      } catch (error) {
        if (!fs.existsSync(active) && fs.existsSync(safety))
          fs.renameSync(safety, active);
        throw error;
      }
    } catch (error) {
      for (const file of restoredFiles)
        if (fs.existsSync(file)) fs.unlinkSync(file);
      if (closed) await initializeDatabase();
      throw error;
    } finally {
      if (fs.existsSync(staged)) fs.unlinkSync(staged);
    }
  }
}
