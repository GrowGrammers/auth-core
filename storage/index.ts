// 토큰 저장소 모듈 export
export * from './TokenStore.interface';
// 플랫폼 의존적인 구현체들은 각 플랫폼 모듈로 이동
// export { WebTokenStore } from './WebTokenStore';
// export { MobileTokenStore } from './MobileTokenStore';
export { FakeTokenStore } from './FakeTokenStore';

// Storage 레이어 전용 응답 생성 유틸리티
import { SuccessResponse, ErrorResponse } from '../shared/types';

/**
 * Storage 레이어에서 사용하는 성공 응답 생성 함수
 * Provider 레이어에 의존하지 않음
 */
export function createStorageSuccessResponse<T>(
  message: string,
  data: T
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Storage 레이어에서 사용하는 에러 응답 생성 함수
 * Provider 레이어에 의존하지 않음
 */
export function createStorageErrorResponse(
  message: string,
  error: string
): ErrorResponse {
  return {
    success: false,
    message,
    error,
    data: null
  };
} 