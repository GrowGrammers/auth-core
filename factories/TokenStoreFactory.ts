// 주어진 타입에 따라 적절한 토큰 저장소 인스턴스를 생성합니다.

import { TokenStore } from '../storage/TokenStore.interface';
import { WebTokenStore } from '../storage/WebTokenStore';
import { MobileTokenStore } from '../storage/MobileTokenStore';
import { FakeTokenStore } from '../storage/FakeTokenStore';

export type TokenStoreType = 'web' | 'mobile' | 'fake';

/**
 * 토큰 저장소 타입을 받아서 해당하는 토큰 저장소 인스턴스를 반환합니다.
 * @param type - 'web' | 'mobile' | 'fake' 등 저장소 타입
 * @returns TokenStore 구현체 인스턴스
 */
export function createTokenStore(type: TokenStoreType): TokenStore {
  switch (type) {
    case 'web':
      return WebTokenStore;
    case 'mobile':
      return MobileTokenStore;
    case 'fake':
      return FakeTokenStore;
    default:
      throw new Error(`Unknown token store type: ${type}`);
  }
} 