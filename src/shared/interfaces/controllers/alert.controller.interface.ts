import { ApiResponse } from '../types/common.types';
import {
  Alert,
  AlertWithStatus,
  CreateAlertInput,
  UpdateAlertInput,
} from '../types/alert.types';
export interface IAlertController {
  occurrences(
    state?: string,
    page?: number,
  ): Promise<
    ApiResponse<
      {
        id: number;
        categoryName: string;
        severity: string;
        percentage: number;
        state: string;
        period: string;
      }[]
    >
  >;
  dismissOccurrence(id: number): Promise<ApiResponse<void>>;

  create(data: CreateAlertInput): Promise<ApiResponse<Alert>>;
  update(id: number, data: UpdateAlertInput): Promise<ApiResponse<Alert>>;
  delete(id: number): Promise<ApiResponse<void>>;
  findAll(): Promise<ApiResponse<Alert[]>>;
  checkAlerts(): Promise<ApiResponse<AlertWithStatus[]>>;
}
