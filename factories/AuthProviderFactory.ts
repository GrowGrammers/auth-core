// 주어진 타입과 설정(config)에 따라 적절한 인증 제공자 인스턴스를 생성합니다.

import { AuthProvider, AuthProviderConfig, EmailAuthProvider, GoogleAuthProvider } from '../providers';
import { AuthProviderType, ApiConfig } from '../shared/types';
import { HttpClient } from '../network/interfaces/HttpClient';

/**
 * 인증 제공자 타입과 설정을 받아서 해당하는 인증 제공자 인스턴스를 반환합니다.
 * @param type - 'email' | 'google' 등 인증 제공자 타입
 * @param config - 인증 제공자별 공통 설정 객체
 * @param httpClient - HTTP 클라이언트 인스턴스
 * @param apiConfig - API 설정 객체
 * @returns AuthProvider 구현체 인스턴스
 */
export function createAuthProvider(
  type: AuthProviderType, 
  config: AuthProviderConfig, 
  httpClient: HttpClient,
  apiConfig: ApiConfig
): AuthProvider {
  switch (type) {
    case 'email':
      return new EmailAuthProvider(config, httpClient, apiConfig);
    case 'google':
      return new GoogleAuthProvider(config, httpClient, apiConfig);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}