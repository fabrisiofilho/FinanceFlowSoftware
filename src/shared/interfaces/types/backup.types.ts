import type { ApiResponse } from './common.types';
export interface BackupAPI {
  export(password: string): Promise<ApiResponse<boolean>>;
  restore(password: string): Promise<ApiResponse<boolean>>;
}
