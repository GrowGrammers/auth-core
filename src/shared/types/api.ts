// API 관련 타입 정의
// shared/types/api.ts

import { ErrorResponse, SuccessResponse } from './common';

// API 엔드포인트 설정
export interface ApiEndpoints {
  // 이메일 인증
  requestVerification: string;
  verifyEmail: string; // 이메일 인증 엔드포인트 추가
  login: string;
  logout: string;
  refresh: string;
  // 구글 인증 (신규 추가)
  googleLogin: string;     // 구글 로그인
  googleLogout: string;    // 구글 로그아웃  
  googleRefresh: string;   // 구글 토큰 갱신
  // 공통
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
export interface ApiSuccessResponse<T = unknown> extends SuccessResponse<T> {
  // SuccessResponse를 상속받아 success: true, data: T, message가 자동으로 포함됨
}

// 실패 응답 타입
export interface ApiErrorResponse extends ErrorResponse {
  // ErrorResponse를 상속받아 error 필드 포함
}
