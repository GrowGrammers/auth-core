// Google OAuth 인증 API 구현
import { ApiConfig, Token, UserInfo } from '../shared/types';
import { HttpClient } from './interfaces/HttpClient';
import { 
  LoginRequest, 
  LogoutRequest, 
  RefreshTokenRequest,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse
} from '../providers/interfaces/dtos/auth.dto';

import { createErrorResponse } from '../shared/utils/errorUtils';

/**
 * Google OAuth 로그인 (v2.0에서 구현 예정)
 */
export async function loginByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<LoginApiResponse> {
  return createErrorResponse('Google 로그인은 아직 구현되지 않았습니다.');
}

/**
 * Google OAuth 로그아웃 (v2.0에서 구현 예정)
 */
export async function logoutByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<LogoutApiResponse> {
  return createErrorResponse('Google 로그아웃은 아직 구현되지 않았습니다.');
}

/**
 * Google OAuth 토큰 갱신 (v2.0에서 구현 예정)
 */
export async function refreshTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<RefreshTokenApiResponse> {
  return createErrorResponse('Google 토큰 갱신은 아직 구현되지 않았습니다.');
}

/**
 * Google OAuth 토큰 검증 (v2.0에서 구현 예정)
 */
export async function validateTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<TokenValidationApiResponse> {
  // TODO: v2.0에서 Google OAuth 구현
  return createErrorResponse('Google 토큰 검증은 아직 구현되지 않았습니다.');
}

/**
 * Google OAuth 사용자 정보 조회 (v2.0에서 구현 예정)
 */
export async function getUserInfoByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<UserInfoApiResponse> {
  // TODO: v2.0에서 Google OAuth 구현
  return createErrorResponse('Google 사용자 정보 조회는 아직 구현되지 않았습니다.');
}

/**
 * Google OAuth 서비스 가용성 확인 (v2.0에서 구현 예정)
 */
export async function checkGoogleServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<ServiceAvailabilityApiResponse> {
  // TODO: v2.0에서 Google OAuth 구현
  return createErrorResponse('Google 서비스 가용성 확인은 아직 구현되지 않았습니다.');
} 