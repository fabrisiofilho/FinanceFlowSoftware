import type { ApiResponse } from '../types/common.types';
import type { ImportResult, ImportPreview } from '../types/import.types';
export interface IImportController {
  previewCSV(csvContent: string): Promise<ApiResponse<ImportPreview>>;
  importCSV(csvContent: string): Promise<ApiResponse<ImportResult>>;
}
