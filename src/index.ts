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
  RefreshTokenResponse,
  EmailVerificationApiResponse,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse
} from './providers';

// 구현체들
export { EmailAuthProvider, GoogleAuthProvider } from './providers';
export { BaseAuthProvider } from './providers/base/BaseAuthProvider';

// 토큰 저장소 관련
export { TokenStore } from './storage';
export { FakeTokenStore } from './storage';
export { WebTokenStore } from './storage/implementations/WebTokenStore';
export { MobileTokenStore } from './storage/implementations/MobileTokenStore';
export { 
  SaveTokenResponse, 
  GetTokenResponse, 
  RemoveTokenResponse, 
  HasTokenResponse, 
  IsTokenExpiredResponse, 
  ClearResponse 
} from './storage/TokenStore.interface';

// HTTP 클라이언트 인터페이스
export { HttpClient, HttpRequestConfig, HttpResponse } from './network/interfaces/HttpClient';

// 타입들
export { Token, UserInfo, AuthProviderType, BaseResponse, BaseRequest, ApiConfig, ApiEndpoints } from './shared/types';

// 팩토리 함수들
export { 
  createAuthProvider, 
  AuthProviderFactoryResult,
  isAuthProviderFactorySuccess,
  isAuthProviderFactoryError
} from './factories/AuthProviderFactory';
export { 
  TokenStoreType, 
  TokenStoreRegistry,
  TokenStoreFactoryResult,
  isTokenStoreFactorySuccess,
  isTokenStoreFactoryError
} from './factories/TokenStoreFactory';

// AuthManager 설정 타입
export { AuthManagerConfig } from './AuthManager';

// Network 모듈
export * from './network'; 