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
  ServiceAvailabilityApiResponse,

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
    // Google 로그인 요청 타입 가드
    if (!('authCode' in request)) {
      return createErrorResponse('구글 로그인 요청이 아닙니다.');
    }

    // 구글 인증 코드 검증
    if (!request.authCode) {
      return createValidationErrorResponse('구글 인증 코드');
    }

    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.googleLogin,  // login → googleLogin으로 변경
      {
        method: 'POST',
        body: { authCode: request.authCode }
      }
    );

    const data = await handleHttpResponse<LoginApiResponse>(response, '구글 로그인에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

export async function logoutByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<LogoutApiResponse> {
  try {
    // 쿠키 기반 로그아웃: 쿠키를 헤더로 전송 (백엔드에서 쿠키에서 refreshToken 추출)
    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.googleLogout,  // logout → googleLogout으로 변경
      {
        method: 'POST',
        // 쿠키는 브라우저가 자동으로 전송하므로 별도 설정 불필요
        // body에 refreshToken을 포함하지 않음
      }
    );

    const data = await handleHttpResponse<LogoutApiResponse>(response, '구글 로그아웃에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

export async function refreshTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<RefreshTokenApiResponse> {
  try {
    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.googleRefresh,  // refresh → googleRefresh으로 변경
      {
        method: 'POST',
        // refreshToken은 쿠키로 전송되므로 body 없음
        // credentials: 'include'는 HttpClient에서 공통 적용됨
      }
    );

    const data = await handleHttpResponse<RefreshTokenApiResponse>(response, '구글 토큰 갱신에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Google OAuth 토큰 검증
 * 우리 백엔드 OAuth 엔드포인트를 통해 토큰 검증
 */
export async function validateTokenByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<TokenValidationApiResponse> {
  try {
    if (!token.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequestWithRetry(
      httpClient,
      config,
      config.endpoints.googleValidate, // /api/auth/google/validate
      {
        method: 'POST',
        body: { accessToken: token.accessToken }
      }
    );

    const data = await handleHttpResponse<TokenValidationApiResponse>(response, 'Google 토큰 검증에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Google OAuth 사용자 정보 조회
 * 우리 백엔드 OAuth 엔드포인트를 통해 사용자 정보 조회
 */
export async function getUserInfoByGoogle(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<UserInfoApiResponse> {
  try {
    if (!token.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequestWithRetry(
      httpClient,
      config,
      config.endpoints.googleUserinfo, // /api/auth/google/userinfo
      {
        method: 'POST',
        body: { accessToken: token.accessToken }
      }
    );

    const data = await handleHttpResponse<UserInfoApiResponse>(response, 'Google 사용자 정보 조회에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Google OAuth 서비스 가용성 확인 (v2.0에서 구현 예정)
 */
export async function checkGoogleServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<ServiceAvailabilityApiResponse> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.health, {
      method: 'GET'
    });

    const data = await handleHttpResponse<ServiceAvailabilityApiResponse>(response, 'Google 서비스 가용성 확인에 실패했습니다.');
    return data;
  } catch (error) {
    return createNetworkErrorResponse();
  }
} 