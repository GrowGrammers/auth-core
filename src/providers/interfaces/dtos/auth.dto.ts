// 인증 관련 DTO 정의
import { Token, UserInfo, SuccessResponse, ErrorResponse, BaseRequest } from '../../../shared/types';

// 이메일 인증번호 요청 DTO
export interface EmailVerificationRequest {
  email: string;
}

// 이메일 인증번호 요청 응답 DTO
export interface EmailVerificationResponse extends SuccessResponse<void> {
}

// 이메일 인증 DTO (인증번호 검증)
export interface EmailVerificationConfirmRequest {
  email: string;
  verifyCode: string;
}

// 이메일 인증 확인 응답 DTO
export interface EmailVerificationConfirmResponse extends SuccessResponse<void> {
}

// 이메일 로그인 요청 DTO
export interface EmailLoginRequest extends BaseRequest {
  email: string;
  verifyCode: string;
  deviceId?: string; // 모바일용 디바이스 ID (선택적)
}

// OAuth 로그인 요청 DTO (모든 소셜 로그인 통합)
export interface OAuthLoginRequest extends BaseRequest {
  authCode: string;        // 모든 OAuth에서 공통으로 사용
  redirectUri?: string;    // OAuth 리다이렉트 URI (선택적)
  deviceId?: string;       // 모바일용 디바이스 ID (선택적)
}

// 통합 로그인 요청 DTO (유니온 타입)
export type LoginRequest = EmailLoginRequest | OAuthLoginRequest;

// 백엔드 로그인 응답 데이터 구조 (플랫폼 통일)
export interface LoginResponseData {
  accessToken: string;     // 응답 바디로 받음 (웹/모바일 공통)
  refreshToken: string | null; // 웹: null (쿠키로 받음), 모바일: 실제 토큰 값
  expiredAt?: number;
  userInfo: UserInfo;
}

// 로그인 응답 DTO
export interface LoginResponse extends SuccessResponse<LoginResponseData> {}

// 로그아웃 요청 DTO (쿠키 기반)
export interface LogoutRequest extends BaseRequest {
  // refreshToken은 쿠키에서 자동으로 추출됨 (요청 바디에 포함되지 않음)
  deviceId?: string;       // 모바일용 디바이스 ID (선택적)
}

// 로그아웃 응답 DTO
export interface LogoutResponse extends SuccessResponse<void> {
  // SuccessResponse의 success: true, message, data 필드를 상속받음
}

// 토큰 갱신 요청 DTO
export interface RefreshTokenRequest extends BaseRequest {
  // refreshToken은 쿠키로 전송됨 (바디에 포함하지 않음)
  deviceId?: string;       // 모바일용 디바이스 ID (선택적)
  refreshToken?: string;   // 모바일용 (앱에서는 바디에 포함)
}

// 토큰 갱신 응답 DTO
export interface RefreshTokenResponse extends SuccessResponse<Token> {}

// 토큰 검증 응답 DTO
export interface TokenValidationResponse extends SuccessResponse<boolean> {}

// 사용자 정보 조회 응답 DTO
export interface UserInfoResponse extends SuccessResponse<UserInfo> {}

// 서비스 가용성 확인 응답 DTO
export interface ServiceAvailabilityResponse extends SuccessResponse<boolean> {}

// API 응답 타입들
export type EmailVerificationApiResponse = EmailVerificationResponse | ErrorResponse;
export type EmailVerificationConfirmApiResponse = EmailVerificationConfirmResponse | ErrorResponse;
export type LoginApiResponse = LoginResponse | ErrorResponse;
export type LogoutApiResponse = LogoutResponse | ErrorResponse;
export type RefreshTokenApiResponse = RefreshTokenResponse | ErrorResponse;
export type TokenValidationApiResponse = TokenValidationResponse | ErrorResponse;
export type UserInfoApiResponse = UserInfoResponse | ErrorResponse;
export type ServiceAvailabilityApiResponse = ServiceAvailabilityResponse | ErrorResponse; 