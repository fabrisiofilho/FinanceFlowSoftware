import type { ApiResponse } from './common.types';
export interface DiagnosticSnapshot {
  version: string;
  electron: string;
  chromium: string;
  uptimeSeconds: number;
  initializationMs: number | null;
  mainHeapBytes: number;
  processes: {
    type: string;
    workingSetKb: number;
    privateBytesKb: number | null;
  }[];
  sqliteBytes: number;
  walBytes: number;
  shmBytes: number;
  attachmentBytes: number;
  cacheBytes: number;
  dataDirectory: string;
  queryMs: number;
}
export interface DiagnosticsAPI {
  snapshot(): Promise<ApiResponse<DiagnosticSnapshot>>;
}
