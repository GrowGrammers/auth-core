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

import { createErrorResponse, createValidationErrorResponse, createNetworkErrorResponse } from '../shared/utils/errorUtils';
import { makeRequest, makeRequestWithRetry, handleHttpResponse, createToken, createUserInfo } from './utils/httpUtils';

/**
 * Google OAuth 로그인
 */
export async function loginByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<LoginApiResponse> {
  try {
    // 타입 가드: GoogleLoginRequest인지 확인
    if (!('googleToken' in request)) {
      return createErrorResponse('구글 로그인 요청이 아닙니다.');
    }

    // 구글 토큰 검증
    if (!request.googleToken) {
      return createValidationErrorResponse('구글 토큰');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.login, {
      method: 'POST',
      body: { googleToken: request.googleToken }
    });

    const data = await handleHttpResponse<LoginApiResponse>(response, '구글 로그인에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Google OAuth 로그아웃
 */
export async function logoutByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<LogoutApiResponse> {
  try {
    if (!request.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.logout, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.accessToken}`,
      }
    });

    const data = await handleHttpResponse<LogoutApiResponse>(response, '구글 로그아웃에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Google OAuth 토큰 갱신
 */
export async function refreshTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<RefreshTokenApiResponse> {
  try {
    if (!request.refreshToken) {
      return createValidationErrorResponse('리프레시 토큰');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.refresh, {
      method: 'POST',
      body: { refreshToken: request.refreshToken }
    });

    const data = await handleHttpResponse<RefreshTokenApiResponse>(response, '구글 토큰 갱신에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
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