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
  return {
    success: false,
    error: 'Google 로그인은 아직 구현되지 않았습니다.',
    message: 'Google 로그인은 아직 구현되지 않았습니다.',
    data: null
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
  return {
    success: false,
    error: 'Google 로그아웃은 아직 구현되지 않았습니다.',
    message: 'Google 로그아웃은 아직 구현되지 않았습니다.',
    data: null
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
  return {
    success: false,
    error: 'Google 토큰 갱신은 아직 구현되지 않았습니다.',
    message: 'Google 토큰 갱신은 아직 구현되지 않았습니다.',
    data: null
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