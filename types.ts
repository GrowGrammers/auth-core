// 공통 타입 모음 
// types.ts

// 기본 토큰 인터페이스
export interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // unix timestamp
}

// 인증 제공자 타입
export type AuthProviderType = 'email' | 'google';

// 사용자 정보 인터페이스
export interface UserInfo {
  id: string;
  email: string;
  nickname?: string;
  provider: AuthProviderType;
  // 추가 사용자 정보 필요시 확장
}

// 공통 응답 인터페이스
export interface BaseResponse<T = unknown> {
  success: boolean;
  error?: string;
  message: string;
  data?: T | null;
}

// 공통 요청 인터페이스
export interface BaseRequest {
  provider: AuthProviderType;
  rememberMe?: boolean;
}

// API 엔드포인트 설정
export interface ApiEndpoints {
  requestVerification: string;
  login: string;
  logout: string;
  refresh: string;
  validate: string;
  me: string;
  health: string;
}

// API 모듈 공통 타입 정의
export interface ApiConfig {
  apiBaseUrl: string;
  endpoints: ApiEndpoints;
  timeout?: number;
  retryCount?: number;
}

export interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// 성공 응답 타입
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// 실패 응답 타입
export interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}

// 통합 API 응답 타입
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
  