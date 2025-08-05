// Google OAuth 관련 API 함수들 (향후 구현 예정)
import { ApiConfig, ApiResponse, Token, UserInfo } from '../types';
import { 
  LoginRequest, 
  LogoutRequest, 
  RefreshTokenRequest
} from '../providers/interfaces/AuthProvider';

/**
 * Google OAuth 로그인 (향후 구현)
 */
export async function loginByGoogle(
  config: ApiConfig,
  request: LoginRequest
): Promise<ApiResponse<{ token: Token; userInfo: UserInfo }>> {
  // TODO: Google OAuth 구현
  return {
    success: false,
    error: 'GoogleAuthProvider는 아직 구현되지 않았습니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 로그아웃 (향후 구현)
 */
export async function logoutByGoogle(
  config: ApiConfig,
  request: LogoutRequest
): Promise<ApiResponse> {
  // TODO: Google OAuth 구현
  return {
    success: false,
    error: 'GoogleAuthProvider는 아직 구현되지 않았습니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 토큰 갱신 (향후 구현)
 */
export async function refreshTokenByGoogle(
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<ApiResponse<{ token: Token }>> {
  // TODO: Google OAuth 구현
  return {
    success: false,
    error: 'GoogleAuthProvider는 아직 구현되지 않았습니다.',
    errorCode: 'NOT_IMPLEMENTED'
  };
}

/**
 * Google OAuth 토큰 검증 (향후 구현)
 */
export async function validateTokenByGoogle(
  config: ApiConfig,
  token: Token
): Promise<boolean> {
  // TODO: Google OAuth 구현
  return false;
}

/**
 * Google OAuth 사용자 정보 조회 (향후 구현)
 */
export async function getUserInfoByGoogle(
  config: ApiConfig,
  token: Token
): Promise<UserInfo | null> {
  // TODO: Google OAuth 구현
  return null;
}

/**
 * Google OAuth 서비스 가용성 확인 (향후 구현)
 */
export async function checkGoogleServiceAvailability(
  config: ApiConfig
): Promise<boolean> {
  // TODO: Google OAuth 구현
  return false;
} 