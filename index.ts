// 진입점 export 정리

// 주요 클래스들
export { AuthManager } from './AuthManager';

// 인터페이스들
export { 
  AuthProvider, 
  AuthProviderConfig,
  EmailVerificationRequest,
  EmailVerificationResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from './providers';

// 구현체들
export { EmailAuthProvider, GoogleAuthProvider } from './providers';
export { BaseAuthProvider } from './providers/base/BaseAuthProvider';

// 토큰 저장소 관련 - 인터페이스만 export
export { TokenStore } from './storage';
export { FakeTokenStore } from './storage';

// HTTP 클라이언트 인터페이스
export { HttpClient, HttpRequestConfig, HttpResponse } from './api/interfaces/HttpClient';

// 타입들
export { Token, UserInfo, AuthProviderType, BaseResponse, BaseRequest } from './types';

// 팩토리 함수들
export { createAuthProvider } from './factories/AuthProviderFactory';
export { createTokenStore, TokenStoreType, TokenStoreRegistry } from './factories/TokenStoreFactory';
export { 
  createAuthManager, 
  createAuthManagerFromInstances
} from './factories/AuthManagerFactory';

// API 모듈
export * from './api'; 