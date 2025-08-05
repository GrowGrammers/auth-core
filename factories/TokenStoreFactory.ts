// 주어진 타입에 따라 적절한 토큰 저장소 인스턴스를 생성합니다.

import { TokenStore } from '../storage/TokenStore.interface';
import { FakeTokenStore } from '../storage/FakeTokenStore';

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

/**
 * 토큰 저장소 타입을 받아서 해당하는 토큰 저장소 인스턴스를 반환합니다.
 * @param type - 'web' | 'mobile' | 'fake' 등 저장소 타입
 * @param registry - 플랫폼별 TokenStore 구현체 레지스트리 (선택사항)
 * @returns TokenStore 구현체 인스턴스
 */
export function createTokenStore(
  type: TokenStoreType, 
  registry: TokenStoreRegistry = defaultRegistry
): TokenStore {
  const store = registry[type];
  if (!store) {
    throw new Error(`Unknown token store type: ${type}`);
  }
  return store;
} 