// 인증 제공자 인터페이스 및 DTO 정의
import { Token, UserInfo, AuthProviderType } from '../../types';

// 인증 제공자 설정 인터페이스
export interface AuthProviderConfig {
  apiBaseUrl: string;
  timeout?: number;
  retryCount?: number;
}

// 이메일 인증번호 요청 DTO
export interface EmailVerificationRequest {
  email: string;
}

// 이메일 인증번호 요청 응답 DTO
export interface EmailVerificationResponse {
  success: boolean;
  error?: string;
  errorCode?: string;
}

// 이메일 로그인 요청 DTO
export interface EmailLoginRequest {
  provider: 'email';
  email: string;
  verificationCode: string;
  rememberMe?: boolean;
}

// OAuth 로그인 요청 DTO
export interface OAuthLoginRequest {
  provider: 'google'; // 추후 추가 예정
  authCode: string;
  redirectUri?: string;
  rememberMe?: boolean;
}

// 통합 로그인 요청 DTO (유니온 타입)
export type LoginRequest = EmailLoginRequest | OAuthLoginRequest;

// 로그인 응답 DTO
export interface LoginResponse {
  success: boolean;
  token?: Token;
  userInfo?: UserInfo;
  error?: string;
  errorCode?: string;
}

// 로그아웃 요청 DTO
export interface LogoutRequest {
  provider: AuthProviderType;
  token?: Token;
}

// 로그아웃 응답 DTO
export interface LogoutResponse {
  success: boolean;
  error?: string;
}

// 토큰 갱신 요청 DTO
export interface RefreshTokenRequest {
  refreshToken: string;
  provider: AuthProviderType;
}

// 토큰 갱신 응답 DTO
export interface RefreshTokenResponse {
  success: boolean;
  token?: Token;
  error?: string;
}

// 인증 제공자 인터페이스
export interface AuthProvider {
  /**
   * 제공자 이름
   */
  readonly providerName: AuthProviderType;
  
  /**
   * 제공자 설정
   */
  readonly config: AuthProviderConfig;
  
  /**
   * 이메일 인증번호를 요청합니다.
   * @param request 이메일 인증번호 요청 정보
   * @returns 인증번호 요청 결과
   */
  requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse>;
  
  /**
   * 로그인을 수행합니다.
   * @param request 로그인 요청 정보
   * @returns 로그인 결과
   */
  login(request: LoginRequest): Promise<LoginResponse>;
  
  /**
   * 로그아웃을 수행합니다.
   * @param request 로그아웃 요청 정보
   * @returns 로그아웃 결과
   */
  logout(request: LogoutRequest): Promise<LogoutResponse>;
  
  /**
   * 토큰을 갱신합니다.
   * @param request 토큰 갱신 요청 정보
   * @returns 토큰 갱신 결과
   */
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
  
  /**
   * 현재 토큰의 유효성을 검증합니다.
   * @param token 검증할 토큰
   * @returns 유효성 검증 결과
   */
  validateToken(token: Token): Promise<boolean>;
  
  /**
   * 사용자 정보를 가져옵니다.
   * @param token 인증 토큰
   * @returns 사용자 정보
   */
  getUserInfo(token: Token): Promise<UserInfo | null>;
  
  /**
   * 제공자가 사용 가능한지 확인합니다.
   * @returns 사용 가능 여부
   */
  isAvailable(): Promise<boolean>;
} 