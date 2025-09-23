// 주어진 타입과 설정(config)에 따라 적절한 인증 제공자 인스턴스를 생성합니다.

import { AuthProvider, AuthProviderConfig, GoogleAuthProviderConfig, EmailAuthProvider, GoogleAuthProvider } from '../providers';
import { AuthProviderType, ApiConfig, FactoryResult, FactoryErrorResponse, isFactorySuccess, isFactoryError, ClientPlatformType } from '../shared/types';
import { HttpClient } from '../network/interfaces/HttpClient';
import { createErrorResponse } from '../shared/utils/errorUtils';

export type AuthProviderFactoryResult = FactoryResult<AuthProvider>;

/**
 * 타입 가드: 팩토리 결과가 성공인지 확인
 */
export function isAuthProviderFactorySuccess(result: AuthProviderFactoryResult): result is AuthProvider {
  return isFactorySuccess(result);
}

/**
 * 타입 가드: 팩토리 결과가 에러인지 확인
 */
export function isAuthProviderFactoryError(result: AuthProviderFactoryResult): result is FactoryErrorResponse {
  return isFactoryError(result);
}

/**
 * 인증 제공자 타입과 설정을 받아서 해당하는 인증 제공자 인스턴스를 반환합니다.
 * @param type - 'email' | 'google' 등 인증 제공자 타입
 * @param config - 인증 제공자별 공통 설정 객체
 * @param httpClient - HTTP 클라이언트 인스턴스
 * @param apiConfig - API 설정 객체
 * @param platform - 클라이언트 플랫폼 타입 (기본값: 'web')
 * @returns AuthProvider 구현체 인스턴스 또는 에러 응답
 */
export function createAuthProvider(
  type: AuthProviderType, 
  config: AuthProviderConfig, 
  httpClient: HttpClient,
  apiConfig: ApiConfig,
  platform: ClientPlatformType = 'web'
): AuthProviderFactoryResult {
  try {
    switch (type) {
      case 'email':
        return new EmailAuthProvider(config, httpClient, apiConfig, platform);
      case 'google':
        // Google 제공자의 경우 GoogleAuthProviderConfig가 필요
        if (!isGoogleAuthProviderConfig(config)) {
          return createErrorResponse(
            'Google 인증 제공자에는 googleClientId가 필요합니다.',
            'Google 인증 제공자를 생성하려면 googleClientId 설정이 필요합니다.'
          );
        }
        return new GoogleAuthProvider(config, httpClient, apiConfig, platform);
      default:
        return createErrorResponse(
          `지원하지 않는 인증 제공자입니다: ${type}`,
          `지원하지 않는 인증 제공자 타입입니다. (${type})`
        );
    }
  } catch (error) {
    console.error('인증 제공자 생성 중 오류 발생:', error);
    return createErrorResponse(
      '인증 제공자 생성에 실패했습니다.',
      '인증 제공자를 생성하는 중 오류가 발생했습니다.'
    );
  }
}

/**
 * 타입 가드: config가 GoogleAuthProviderConfig인지 확인
 */
function isGoogleAuthProviderConfig(config: AuthProviderConfig): config is GoogleAuthProviderConfig {
  return 'googleClientId' in config && typeof config.googleClientId === 'string';
}