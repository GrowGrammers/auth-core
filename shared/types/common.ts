// 공통 응답 및 요청 인터페이스
// shared/types/common.ts

import { AuthProviderType } from './literals';

// 공통 응답 인터페이스 (성공 응답 전용)
export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | null;
}

// 실패 응답 인터페이스
export interface ErrorResponse extends BaseResponse<null> {
  success: false;
  data: null;
  message: string;
  error: string;
}

// 공통 요청 인터페이스
export interface BaseRequest {
  provider: AuthProviderType; // 타입 안전성 확보
  rememberMe?: boolean;
}
