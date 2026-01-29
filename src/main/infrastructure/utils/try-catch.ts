import { logger } from '@main/infrastructure/log/logger';
import { ApiResponse } from '../../../shared/interfaces/types/common.types';

export function wrap<T, A extends unknown[]>(fn: (...args: A) => Promise<T>) {
  return async (...args: A): Promise<ApiResponse<T>> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
}
