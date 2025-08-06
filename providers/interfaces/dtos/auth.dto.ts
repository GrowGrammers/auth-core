// 인증 관련 DTO 정의
import { Token, UserInfo, AuthProviderType } from '../../../types';

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