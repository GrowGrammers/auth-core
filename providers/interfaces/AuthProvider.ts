// 인증 제공자 인터페이스 및 DTO 정의
import { Token, UserInfo, AuthProviderType } from '../../types';
import { ILoginProvider } from './ILoginProvider';
import { IEmailVerifiable } from './IEmailVerifiable';

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

// 인증 제공자 인터페이스 - 하위 호환성을 위한 유니온 타입
// 새로운 구현체는 ILoginProvider 또는 IEmailVerifiable을 직접 구현하는 것을 권장
export type AuthProvider = ILoginProvider | (ILoginProvider & IEmailVerifiable); 