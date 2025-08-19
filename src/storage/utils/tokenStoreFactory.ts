import { TokenStore } from '../TokenStore.interface';
import { WebTokenStore } from '../implementations/WebTokenStore';
import { MobileTokenStore } from '../implementations/MobileTokenStore';

/**
 * 환경에 맞는 TokenStore를 자동으로 선택하는 팩토리 함수
 */
export function createTokenStore(storage?: any): TokenStore {
  // 브라우저 환경
  if (typeof window !== 'undefined' && window.localStorage) {
    return new WebTokenStore();
  }
  
  // React Native 환경 (AsyncStorage 제공된 경우)
  if (storage && typeof storage.setItem === 'function') {
    return new MobileTokenStore(storage);
  }
  
  // 기본값: 웹 환경
  return new WebTokenStore();
}

/**
 * 특정 환경의 TokenStore를 명시적으로 생성
 */
export const TokenStoreFactory = {
  // 웹 환경용
  createWeb: () => new WebTokenStore(),
  
  // 모바일 환경용
  createMobile: (storage: any) => new MobileTokenStore(storage),
  
  // 자동 선택
  create: createTokenStore
};
