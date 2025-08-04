// 진입점 export 정리

// 주요 클래스들
export { AuthManager } from './AuthManager';

// 인터페이스들
export { 
  AuthProvider, 
  AuthProviderConfig,
  EmailVerificationRequest,
  EmailVerificationResponse,
  BaseAuthProvider,
  EmailAuthProvider,
  GoogleAuthProvider
} from './providers';
export { TokenStore } from './storage/TokenStore.interface';

// 타입들
export { Token, UserInfo, AuthProviderType } from './types';

// 팩토리 함수들
export { createAuthProvider } from './factories/AuthProviderFactory';
export { createTokenStore, TokenStoreType } from './factories/TokenStoreFactory';
export { 
  createAuthManager, 
  createAuthManagerFromInstances
} from './factories/AuthManagerFactory';

// 저장소 구현체들 (필요시에만 export)
export { WebTokenStore } from './storage/WebTokenStore';
export { MobileTokenStore } from './storage/MobileTokenStore';
export { FakeTokenStore } from './storage/FakeTokenStore'; 