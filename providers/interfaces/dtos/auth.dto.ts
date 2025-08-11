// 인증 관련 DTO 정의
import { Token, UserInfo, AuthProviderType, BaseResponse } from '../../../types';

// 이메일 인증번호 요청 DTO
export interface EmailVerificationRequest {
  email: string;
}

// 이메일 인증번호 요청 응답 DTO
export interface EmailVerificationResponse extends BaseResponse<void> {
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
export interface LoginResponse extends BaseResponse<{ token: Token; userInfo: UserInfo }> {
  token?: Token;
  userInfo?: UserInfo;
}

// 로그아웃 요청 DTO
export interface LogoutRequest {
  provider: AuthProviderType;
  token?: Token;
}

// 로그아웃 응답 DTO
export interface LogoutResponse extends BaseResponse<void> {
  // BaseResponse의 success, error, message 필드를 상속받음
}

// 토큰 갱신 요청 DTO
export interface RefreshTokenRequest {
  refreshToken: string;
  provider: AuthProviderType;
}

// 토큰 갱신 응답 DTO
export interface RefreshTokenResponse extends BaseResponse<Token> {
  token?: Token;
} 