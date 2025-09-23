// Kakao OAuth 인증 API 구현
import { ApiConfig, Token, UserInfo, ClientPlatformType } from '../shared/types';
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
import { makeRequest, makeRequestWithRetry, handleHttpResponse, createToken, createUserInfo, createPlatformHeaders } from './utils/httpUtils';

/**
 * Kakao OAuth 로그인 (플랫폼별 처리)
 */
export async function loginByKakao(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest,
  platform: ClientPlatformType = 'web'
): Promise<LoginApiResponse> {
  try {
    // Kakao 로그인 요청 타입 가드
    if (!('authCode' in request)) {
      return createErrorResponse('카카오 로그인 요청이 아닙니다.');
    }

    // 카카오 인증 코드 검증
    if (!request.authCode) {
      return createValidationErrorResponse('카카오 인증 코드');
    }

    // 플랫폼별 요청 바디 구성
    const requestBody: any = { authCode: request.authCode };
    
    // PKCE code verifier 추가 (웹 플랫폼에서 사용)
    if ('codeVerifier' in request && request.codeVerifier) {
      requestBody.codeVerifier = request.codeVerifier;
    }
    
    // 모바일의 경우 deviceId 추가
    if (platform === 'app' && 'deviceId' in request && request.deviceId) {
      requestBody.deviceId = request.deviceId;
    }

    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.kakaoLogin,
      {
        method: 'POST',
        headers: createPlatformHeaders(platform),
        body: requestBody
      }
    );

    const data = await handleHttpResponse<LoginApiResponse>(response, '카카오 로그인에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

export async function logoutByKakao(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest,
  platform: ClientPlatformType = 'web'
): Promise<LogoutApiResponse> {
  try {
    // 요청 바디 구성 (플랫폼별 처리)
    let requestBody: any = undefined;
    
    if (platform === 'app') {
      // 모바일: refreshToken과 deviceId를 바디에 포함
      requestBody = {};
      if (request.refreshToken) {
        requestBody.refreshToken = request.refreshToken;
      }
      if (request.deviceId) {
        requestBody.deviceId = request.deviceId;
      }
    } else {
      // 웹: deviceId만 포함 (refreshToken은 쿠키로 전송)
      if (request.deviceId) {
        requestBody = { deviceId: request.deviceId };
      }
    }

    // 플랫폼별 카카오 로그아웃 요청
    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.kakaoLogout,
      {
        method: 'POST',
        // 웹: 쿠키는 브라우저가 자동으로 전송, 모바일: refreshToken을 바디에 포함
        body: requestBody
      }
    );

    const data = await handleHttpResponse<LogoutApiResponse>(response, '카카오 로그아웃에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

export async function refreshTokenByKakao(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest,
  platform: ClientPlatformType = 'web'
): Promise<RefreshTokenApiResponse> {
  try {
    let requestBody: any = {};

    // 모바일의 경우 refreshToken과 deviceId를 바디에 포함
    if (platform === 'app') {
      if (!request.refreshToken) {
        return createErrorResponse('모바일에서는 refreshToken이 필요합니다.');
      }
      requestBody.refreshToken = request.refreshToken;
      
      if (request.deviceId) {
        requestBody.deviceId = request.deviceId;
      }
    }

    const response = await makeRequestWithRetry(
      httpClient, 
      config, 
      config.endpoints.kakaoRefresh,
      {
        method: 'POST',
        headers: createPlatformHeaders(platform),
        body: platform === 'app' ? requestBody : undefined // 웹은 body 없음 (쿠키 사용)
      }
    );

    const data = await handleHttpResponse<RefreshTokenApiResponse>(response, '카카오 토큰 갱신에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Kakao OAuth 토큰 검증
 * 우리 백엔드 OAuth 엔드포인트를 통해 토큰 검증
 */
export async function validateTokenByKakao(
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
      config.endpoints.kakaoValidate, // /api/auth/kakao/validate
      {
        method: 'POST',
        body: { accessToken: token.accessToken }
      }
    );

    const data = await handleHttpResponse<TokenValidationApiResponse>(response, 'Kakao 토큰 검증에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Kakao OAuth 사용자 정보 조회
 * 우리 백엔드 OAuth 엔드포인트를 통해 사용자 정보 조회
 */
export async function getUserInfoByKakao(
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
      config.endpoints.kakaoUserinfo, // /api/auth/kakao/userinfo
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`
        }
      }
    );

    const data = await handleHttpResponse<UserInfoApiResponse>(response, 'Kakao 사용자 정보 조회에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * Kakao OAuth 서비스 가용성 확인 (v2.0에서 구현 예정)
 */
export async function checkKakaoServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<ServiceAvailabilityApiResponse> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.health, {
      method: 'GET'
    });

    const data = await handleHttpResponse<ServiceAvailabilityApiResponse>(response, 'Kakao 서비스 가용성 확인에 실패했습니다.');
    return data;
  } catch (error) {
    return createNetworkErrorResponse();
  }
}
