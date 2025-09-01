export * from './errorUtils';
export * from './googleOAuthUtils';

// 성공 응답 생성 유틸리티 함수
import { SuccessResponse } from '../types/common';

/**
 * 성공 응답 생성 함수
 */
export function createSuccessResponse<T>(
  message: string,
  data: T
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data
  };
}
