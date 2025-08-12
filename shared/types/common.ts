// 공통 응답 및 요청 인터페이스
// shared/types/common.ts

import { AuthProviderType } from './literals';

// 공통 응답 인터페이스 (기본 속성들)
export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | null;
}

// 성공 응답 인터페이스
export interface SuccessResponse<T = unknown> extends BaseResponse<T> {
  success: true;
  data: T;
}

// 실패 응답 인터페이스
export interface ErrorResponse extends BaseResponse<null> {
  success: false;
  data: null;
  error: string;
}

// 공통 요청 인터페이스
export interface BaseRequest {
  provider: AuthProviderType; // 타입 안전성 확보
  rememberMe?: boolean;
}

// 팩토리 관련 타입들
export interface FactoryErrorResponse extends ErrorResponse {
  // ErrorResponse를 확장하여 추가 속성이나 메서드를 정의할 수 있음
  // 현재는 ErrorResponse와 동일하지만 향후 확장 가능
}

export interface FactorySuccessResponse<T> extends SuccessResponse<T> {
  // SuccessResponse를 확장하여 추가 속성이나 메서드를 정의할 수 있음
  // 현재는 SuccessResponse와 동일하지만 향후 확장 가능
}

export type FactoryResult<T> = T | FactoryErrorResponse;

/**
 * 타입 가드: 팩토리 결과가 성공인지 확인
 */
export function isFactorySuccess<T extends object>(result: FactoryResult<T>): result is T {
  return !('success' in result) || result.success !== false;
}

/**
 * 타입 가드: 팩토리 결과가 에러인지 확인
 */
export function isFactoryError<T extends object>(result: FactoryResult<T>): result is FactoryErrorResponse {
  return 'success' in result && result.success === false;
}
