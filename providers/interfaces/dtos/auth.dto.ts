// 인증 관련 DTO 정의
import { Token, UserInfo, SuccessResponse, ErrorResponse, BaseRequest } from '../../../shared/types';

// 이메일 인증번호 요청 DTO
export interface EmailVerificationRequest {
  email: string;
}

// 이메일 인증번호 요청 응답 DTO
export interface EmailVerificationResponse extends SuccessResponse<void> {
}

// 이메일 로그인 요청 DTO
export interface EmailLoginRequest extends BaseRequest {
  email: string;
  verificationCode: string;
}

// OAuth 로그인 요청 DTO
export interface OAuthLoginRequest extends BaseRequest {
  authCode: string;
  redirectUri?: string;
}

// 통합 로그인 요청 DTO (유니온 타입)
export type LoginRequest = EmailLoginRequest | OAuthLoginRequest;

// 로그인 응답 DTO
export interface LoginResponse extends SuccessResponse<{ token: Token; userInfo: UserInfo }> {}

// 로그아웃 요청 DTO
export interface LogoutRequest extends BaseRequest {
  token?: Token;
}

// 로그아웃 응답 DTO
export interface LogoutResponse extends SuccessResponse<void> {
  // SuccessResponse의 success: true, message, data 필드를 상속받음
}

// 토큰 갱신 요청 DTO
export interface RefreshTokenRequest extends BaseRequest {
  refreshToken: string;
}

// 토큰 갱신 응답 DTO
export interface RefreshTokenResponse extends SuccessResponse<Token> {}

// 응답 타입들을 ErrorResponse와의 유니온 타입으로 정의
export type EmailVerificationApiResponse = EmailVerificationResponse | ErrorResponse;
export type LoginApiResponse = LoginResponse | ErrorResponse;
export type LogoutApiResponse = LogoutResponse | ErrorResponse;
export type RefreshTokenApiResponse = RefreshTokenResponse | ErrorResponse; 