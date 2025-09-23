// AuthManager를 쉽게 생성할 수 있는 팩토리 함수들
// API 설정은 외부에서 주입받도록 수정

import { AuthManager, AuthManagerConfig } from '../AuthManager';
import { AuthProviderType, ApiConfig } from '../shared/types';
import { TokenStore } from '../storage/TokenStore.interface';
import { HttpClient } from '../network/interfaces/HttpClient';
import { createAuthProvider } from './AuthProviderFactory';
import { createTokenStore, TokenStoreType, TokenStoreRegistry } from './TokenStoreFactory';

/**
 * 새로운 AuthManager 생성 방식 - API 설정을 외부에서 주입받음
 * @param config - AuthManager 설정 (providerType, apiConfig 포함)
 * @param httpClient - HTTP 클라이언트 인스턴스
 * @param tokenStoreType - 토큰 저장소 타입 (선택사항)
 * @param tokenStoreRegistry - 토큰 저장소 레지스트리 (선택사항)
 * @returns AuthManager 인스턴스
 */
export function createAuthManager(
  config: AuthManagerConfig,
  httpClient: HttpClient,
  tokenStoreType?: TokenStoreType,
  tokenStoreRegistry?: TokenStoreRegistry
): AuthManager {
  try {
    return new AuthManager(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    throw new Error(`[AuthManagerFactory] AuthManager 생성 실패: ${errorMessage}`);
  }
}

/**
 * 기존 방식과의 호환성을 위한 함수 (deprecated)
 * @deprecated 새로운 createAuthManager 사용을 권장합니다.
 */
export function createAuthManagerLegacy(
  providerType: AuthProviderType,
  tokenStoreType: TokenStoreType,
  config: any,
  httpClient: HttpClient,
  apiConfig: ApiConfig,
  tokenStoreRegistry?: TokenStoreRegistry
): AuthManager {
  const authManagerConfig: AuthManagerConfig = {
    providerType,
    apiConfig,
    httpClient
  };
  
  return new AuthManager(authManagerConfig);
} 