// API 관련 타입 정의
// shared/types/api.ts

import { BaseResponse } from './common';

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
export interface ApiSuccessResponse<T = unknown> extends BaseResponse<T> {
  success: true;
  data: T;
  message: string;
}

// 실패 응답 타입
export interface ApiErrorResponse extends BaseResponse<never> {
  success: false;
  error: string;
  message: string;
  data: null;
}

// 통합 API 응답 타입
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
