// 주어진 타입에 따라 적절한 토큰 저장소 인스턴스를 생성합니다.

import { TokenStore } from '../storage/TokenStore.interface';
import { FakeTokenStore } from '../storage/FakeTokenStore';
import { createErrorResponse } from '../shared/utils/errorUtils';
import { FactoryResult, FactoryErrorResponse, isFactorySuccess, isFactoryError } from '../shared/types';

export type TokenStoreType = 'web' | 'mobile' | 'fake';

// 플랫폼별 TokenStore 구현체들을 외부에서 주입받기 위한 인터페이스
export interface TokenStoreRegistry {
  web: TokenStore;
  mobile: TokenStore;
  fake: TokenStore;
}

// 기본 레지스트리 (FakeTokenStore만 포함)
const defaultRegistry: TokenStoreRegistry = {
  web: FakeTokenStore, // 임시로 FakeTokenStore 사용
  mobile: FakeTokenStore, // 임시로 FakeTokenStore 사용
  fake: FakeTokenStore
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
 * @param type - 'web' | 'mobile' | 'fake' 등 저장소 타입
 * @param registry - 플랫폼별 TokenStore 구현체 레지스트리 (선택사항)
 * @returns TokenStore 구현체 인스턴스 또는 에러 응답
 */
export function createTokenStore(
  type: TokenStoreType, 
  registry: TokenStoreRegistry = defaultRegistry
): TokenStoreFactoryResult {
  try {
    const store = registry[type];
    if (!store) {
      return createErrorResponse(
        `지원하지 않는 토큰 저장소 타입입니다: ${type}`,
        `지원하지 않는 토큰 저장소 타입입니다. (${type})`
      );
    }
    return store;
  } catch (error) {
    console.error('토큰 저장소 생성 중 오류 발생:', error);
    return createErrorResponse(
      '토큰 저장소 생성에 실패했습니다.',
      '토큰 저장소를 생성하는 중 오류가 발생했습니다.'
    );
  }
} 