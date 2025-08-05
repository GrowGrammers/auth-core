// API 설정 유틸리티 함수들
import { ApiConfig, ApiEndpoints } from '../../types';

/**
 * 기본 API 엔드포인트 설정을 반환합니다.
 */
export function getDefaultEndpoints(): ApiEndpoints {
  return {
    requestVerification: '/auth/request-verification',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    validate: '/auth/validate',
    me: '/auth/me',
    health: '/health'
  };
}

/**
 * 기본 API 설정을 반환합니다.
 */
export function getDefaultApiConfig(apiBaseUrl: string): ApiConfig {
  return {
    apiBaseUrl,
    endpoints: getDefaultEndpoints(),
    timeout: 10000,
    retryCount: 3
  };
}

/**
 * 기존 설정에 새로운 엔드포인트를 병합합니다.
 */
export function mergeApiConfig(
  baseConfig: ApiConfig,
  customEndpoints?: Partial<ApiEndpoints>
): ApiConfig {
  return {
    ...baseConfig,
    endpoints: {
      ...baseConfig.endpoints,
      ...customEndpoints
    }
  };
} 