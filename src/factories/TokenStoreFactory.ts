// 주어진 타입에 따라 적절한 토큰 저장소 인스턴스를 생성합니다.

import { TokenStore } from '../storage/TokenStore.interface';
import { FakeTokenStore } from '../storage/FakeTokenStore';
import { WebTokenStore } from '../storage/implementations/WebTokenStore';
import { ReactNativeTokenStore } from '../storage/implementations/ReactNativeTokenStore';
import { createErrorResponse } from '../shared/utils/errorUtils';
import { FactoryResult, FactoryErrorResponse, isFactorySuccess, isFactoryError } from '../shared/types';

export type TokenStoreType = 'web' | 'mobile' | 'react-native' | 'fake' | 'auto';

// 플랫폼별 TokenStore 생성 함수들을 외부에서 주입받기 위한 인터페이스
export interface TokenStoreRegistry {
  web: () => WebTokenStore;
  mobile: (storage?: any, nativeBridge?: any) => ReactNativeTokenStore; // mobile을 react-native로 변경
  'react-native': (storage?: any, nativeBridge?: any) => ReactNativeTokenStore;
  fake: () => typeof FakeTokenStore;
}

// 기본 레지스트리 (실제 구현체 생성 함수들 포함)
const defaultRegistry: TokenStoreRegistry = {
  web: () => new WebTokenStore(),
  mobile: (storage?: any, nativeBridge?: any) => new ReactNativeTokenStore(nativeBridge), // 간소화된 버전
  'react-native': (storage?: any, nativeBridge?: any) => new ReactNativeTokenStore(nativeBridge), // 간소화된 버전
  fake: () => FakeTokenStore
};

export type TokenStoreFactoryResult = FactoryResult<TokenStore>;

/**
 * 타입 가드: 팩토리 결과가 성공인지 확인
 */
export function isTokenStoreFactorySuccess(result: TokenStoreFactoryResult): result is TokenStore {
  return isFactorySuccess(result);
}

/**
 * 타입 가드: 팩토리 결과가 에러인지 확인
 */
export function isTokenStoreFactoryError(result: TokenStoreFactoryResult): result is FactoryErrorResponse {
  return isFactoryError(result);
}

/**
 * 토큰 저장소 타입을 받아서 해당하는 토큰 저장소 인스턴스를 반환합니다.
 * @param type - 'web' | 'mobile' | 'react-native' | 'fake' 등 저장소 타입
 * @param registry - 플랫폼별 TokenStore 구현체 레지스트리 (선택사항)
 * @param storage - AsyncStorage (React Native용)
 * @param nativeBridge - Native Bridge 인터페이스 (React Native용)
 * @returns TokenStore 구현체 인스턴스 또는 에러 응답
 */
export function createTokenStore(
  type: TokenStoreType, 
  registry: TokenStoreRegistry = defaultRegistry,
  storage?: any,
  nativeBridge?: any
): TokenStoreFactoryResult {
  try {
    // auto 타입인 경우 환경 자동 감지
    if (type === 'auto') {
      // 브라우저 환경
      if (typeof window !== 'undefined' && window.localStorage) {
        return new WebTokenStore();
      }
      
      // React Native 환경 (nativeBridge 제공된 경우)
      if (nativeBridge) {
        return new ReactNativeTokenStore(nativeBridge);
      }
      
      // 기본값: 웹 환경
      return new WebTokenStore();
    }
    
    // 기존 타입 기반 선택
    const storeFactory = registry[type as keyof TokenStoreRegistry];
    if (!storeFactory) {
      return createErrorResponse(
        `지원하지 않는 토큰 저장소 타입입니다: ${type}`,
        `지원하지 않는 토큰 저장소 타입입니다. (${type})`
      );
    }
    
    // mobile, react-native 타입인 경우 nativeBridge 인자 전달
    if (type === 'mobile' || type === 'react-native') {
      return storeFactory(storage, nativeBridge);
    }
    
    // 다른 타입들은 인자 없이 호출
    return storeFactory();
  } catch (error) {
    console.error('토큰 저장소 생성 중 오류 발생:', error);
    return createErrorResponse(
      '토큰 저장소 생성에 실패했습니다.',
      '토큰 저장소를 생성하는 중 오류가 발생했습니다.'
    );
  }
} 