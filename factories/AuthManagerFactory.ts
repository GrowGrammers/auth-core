// 폴더구조 수정 예정 -> AuthManagerFactory가 상위 팩토리임을 나타내는 구조
// AuthManager를 쉽게 생성할 수 있는 팩토리 함수들

import { AuthManager } from '../AuthManager';
import { AuthProvider, AuthProviderConfig } from '../providers';
import { AuthProviderType } from '../types';
import { TokenStore } from '../storage/TokenStore.interface';
import { createAuthProvider } from './AuthProviderFactory';
import { createTokenStore, TokenStoreType } from './TokenStoreFactory';

/**
 * 타입과 설정을 받아서 AuthManager 인스턴스를 생성합니다.
 * @param providerType - 인증 제공자 타입 ('email' | 'google')
 * @param tokenStoreType - 토큰 저장소 타입 ('web' | 'mobile' | 'fake')
 * @param config - 인증 제공자 설정
 * @returns AuthManager 인스턴스
 */
export function createAuthManager(
  providerType: AuthProviderType,
  tokenStoreType: TokenStoreType,
  config: AuthProviderConfig
): AuthManager {
  const provider = createAuthProvider(providerType, config);
  const tokenStore = createTokenStore(tokenStoreType);
  
  return new AuthManager(provider, tokenStore);
}

/**
 * 이미 생성된 Provider와 TokenStore를 받아서 AuthManager를 생성합니다.
 * @param provider - 인증 제공자 인스턴스
 * @param tokenStore - 토큰 저장소 인스턴스
 * @returns AuthManager 인스턴스
 */
export function createAuthManagerFromInstances(
  provider: AuthProvider,
  tokenStore: TokenStore
): AuthManager {
  return new AuthManager(provider, tokenStore);
} 