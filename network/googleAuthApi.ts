// Google OAuth 관련 API 함수들 (v2.0에서 구현 예정)
import { ApiConfig, ApiResponse, Token, UserInfo } from '../types';
import { HttpClient } from './interfaces/HttpClient';
import { 
  LoginRequest, 
  LogoutRequest, 
  RefreshTokenRequest
} from '../providers/interfaces/dtos/auth.dto';

/**
 * Google OAuth 로그인 (v2.0에서 구현 예정)
 */
export async function loginByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<ApiResponse<{ token: Token; userInfo: UserInfo }>> {
  // TODO: v2.0에서 Google OAuth 구현
  return {
    success: false,
    error: 'Google OAuth는 v2.0에서 구현될 예정입니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 로그아웃 (v2.0에서 구현 예정)
 */
export async function logoutByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<ApiResponse> {
  // TODO: v2.0에서 Google OAuth 구현
  return {
    success: false,
    error: 'Google OAuth는 v2.0에서 구현될 예정입니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 토큰 갱신 (v2.0에서 구현 예정)
 */
export async function refreshTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<ApiResponse<{ token: Token }>> {
  // TODO: v2.0에서 Google OAuth 구현
  return {
    success: false,
    error: 'Google OAuth는 v2.0에서 구현될 예정입니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 토큰 검증 (v2.0에서 구현 예정)
 */
export async function validateTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<boolean> {
  // TODO: v2.0에서 Google OAuth 구현
  return false;
}

/**
 * Google OAuth 사용자 정보 조회 (v2.0에서 구현 예정)
 */
export async function getUserInfoByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<UserInfo | null> {
  // TODO: v2.0에서 Google OAuth 구현
  return null;
}

/**
 * Google OAuth 서비스 가용성 확인 (v2.0에서 구현 예정)
 */
export async function checkGoogleServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<boolean> {
  // TODO: v2.0에서 Google OAuth 구현
  return false;
} 