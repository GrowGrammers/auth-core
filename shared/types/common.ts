// 공통 응답 및 요청 인터페이스
// shared/types/common.ts

// 공통 응답 인터페이스 (성공 응답 전용)
export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | null;
}

// 실패 응답 인터페이스
export interface ErrorResponse extends BaseResponse<never> {
  success: false;
  data: null;
  message: string;
  error: string;
}

// 공통 요청 인터페이스
export interface BaseRequest {
  provider: string; // AuthProviderType을 string으로 참조 (순환 참조 방지)
  rememberMe?: boolean;
}
