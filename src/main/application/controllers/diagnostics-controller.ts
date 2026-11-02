import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { getDataSource, getDatabasePath } from '@main/infrastructure/database/data-source';
import { BaseHandler } from './config/base-handler';
import { IpcMethod } from '@main/infrastructure/decorators/ipc.decorator';
import { wrap } from '@main/infrastructure/utils/try-catch';
import type { DiagnosticSnapshot } from '@shared/interfaces/types/diagnostics.types';
let initializationMs: number | null = null;
export function markInitializationComplete() { initializationMs = Math.round(process.uptime() * 1000); }
async function fileSize(file: string): Promise<number> { try { return (await fs.stat(file)).size; } catch { return 0; } }
async function directorySize(directory: string): Promise<number> {
  try {
    let total = 0;
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const file = path.join(directory,entry.name);
      total += entry.isDirectory() ? await directorySize(file) : await fileSize(file);
    }
    return total;
  } catch { return 0; }
}
export class DiagnosticsController extends BaseHandler {
  @IpcMethod('diagnostics:snapshot') snapshot() {
    return wrap(async (): Promise<DiagnosticSnapshot> => {
      const database = getDatabasePath(), dataDirectory = app.getPath('userData');
      const start = performance.now(); await getDataSource().query('SELECT 1'); const queryMs = performance.now()-start;
      const [sqliteBytes,walBytes,shmBytes,attachmentBytes,cacheBytes] = await Promise.all([fileSize(database),fileSize(database+'-wal'),fileSize(database+'-shm'),directorySize(path.join(dataDirectory,'attachments')),directorySize(path.join(dataDirectory,'Cache'))]);
      return { version:app.getVersion(),electron:process.versions.electron ?? '',chromium:process.versions.chrome ?? '',uptimeSeconds:process.uptime(),initializationMs,mainHeapBytes:process.memoryUsage().heapUsed,
        processes:app.getAppMetrics().map((m) => ({type:m.type,workingSetKb:m.memory.workingSetSize,privateBytesKb:m.memory.privateBytes})),
        sqliteBytes,walBytes,shmBytes,attachmentBytes,cacheBytes,dataDirectory,queryMs };
    })();
  }
}
