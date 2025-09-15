// EmailAuthProvider를 위한 실제 HTTP 통신 함수 모음
import { HttpClient } from './interfaces/HttpClient';
import { ApiConfig } from '../shared/types';
import { 
  EmailLoginRequest, 
  LoginApiResponse, 
  LogoutApiResponse, 
  RefreshTokenApiResponse,
  EmailVerificationApiResponse,
  EmailVerificationRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse,
  EmailVerificationConfirmRequest,
  EmailVerificationConfirmApiResponse
} from '../providers/interfaces/dtos/auth.dto';
import { makeRequest, makeRequestWithRetry, handleHttpResponse, createToken, createUserInfo, createPlatformHeaders } from './utils/httpUtils';
import { 
  createErrorResponse, 
  createNetworkErrorResponse, 
  createValidationErrorResponse,
  createTokenValidationErrorResponse,
  createUserInfoErrorResponse,
  createServiceAvailabilityErrorResponse,
  createServerErrorResponse
} from '../shared/utils';
import { Token, UserInfo, ClientPlatformType } from '../shared/types';

/**
 * 이메일 인증번호 요청
 */
export async function requestEmailVerification(
  httpClient: HttpClient,
  config: ApiConfig,
  request: EmailVerificationRequest
): Promise<EmailVerificationApiResponse> {
  try {
    // 이메일 검증
    if (!request.email) {
      return createValidationErrorResponse('이메일');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.requestVerification, {
      method: 'POST',
      body: { email: request.email }
    });

    const data = await handleHttpResponse<EmailVerificationApiResponse>(response, '인증번호 요청에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 이메일 인증번호 확인
 */
export async function verifyEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: EmailVerificationConfirmRequest
): Promise<EmailVerificationConfirmApiResponse> {
  try {
    // 이메일과 인증번호 검증
    if (!request.email) {
      return createValidationErrorResponse('이메일');
    }
    if (!request.verifyCode) {
      return createValidationErrorResponse('인증번호');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.verifyEmail, {
      method: 'POST',
      body: { email: request.email, verifyCode: request.verifyCode }  // code → verifyCode로 통일
    });

    const data = await handleHttpResponse<EmailVerificationConfirmApiResponse>(response, '이메일 인증에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 이메일 로그인 (플랫폼별 처리)
 */
export async function loginByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest,
  platform: ClientPlatformType = 'web'
): Promise<LoginApiResponse> {
  try {
    // 타입 가드로 이메일 로그인 요청인지 확인
    if (request.provider !== 'email') {
      return createErrorResponse('잘못된 인증 제공자입니다.');
    }

    const emailRequest = request as EmailLoginRequest;

    // 이메일 로그인 검증
    if (!emailRequest.email) {
      return createErrorResponse('이메일이 필요합니다.');
    }
    if (!emailRequest.verifyCode) {
      return createErrorResponse('인증번호가 필요합니다.');
    }

    // 플랫폼별 요청 바디 구성
    const requestBody: any = {
      email: emailRequest.email,
      verifyCode: emailRequest.verifyCode
    };

    // 모바일의 경우 deviceId 추가
    if (platform === 'app' && emailRequest.deviceId) {
      requestBody.deviceId = emailRequest.deviceId;
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.login, {
      method: 'POST',
      headers: createPlatformHeaders(platform),
      body: requestBody
    });

    const data = await handleHttpResponse<LoginApiResponse>(response, '로그인에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 이메일 로그아웃 (플랫폼별 처리)
 * 웹: refreshToken은 쿠키로 전송, 모바일: refreshToken은 바디에 포함
 * accessToken은 Authorization 헤더로 전송
 */
export async function logoutByEmail(
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

    // 헤더 구성 (accessToken 포함)
    const headers = createPlatformHeaders(platform);
    if (request.accessToken) {
      headers['Authorization'] = `Bearer ${request.accessToken}`;
    }

    // 플랫폼별 로그아웃 요청
    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.logout, {
      method: 'POST',
      headers,
      // 웹: 쿠키는 브라우저가 자동으로 전송, 모바일: refreshToken을 바디에 포함
      body: requestBody
    });

    const data = await handleHttpResponse<LogoutApiResponse>(response, '로그아웃에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 토큰 갱신 (플랫폼별 처리)
 * 웹: refreshToken은 쿠키로 전송, 모바일: refreshToken은 바디에 포함
 */
export async function refreshTokenByEmail(
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

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.refresh, {
      method: 'POST',
      headers: createPlatformHeaders(platform),
      body: platform === 'app' ? requestBody : undefined // 웹은 body 없음 (쿠키 사용)
    });

    const data = await handleHttpResponse<RefreshTokenApiResponse>(response, '토큰 갱신에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 토큰 검증
 */
export async function validateTokenByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<TokenValidationApiResponse> {
  try {
    if (!token.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequest(httpClient, config, config.endpoints.validate, {
      method: 'POST',
      body: { accessToken: token.accessToken }
    });

    const data = await handleHttpResponse<TokenValidationApiResponse>(response, '토큰 검증에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 사용자 정보 조회
 */
export async function getUserInfoByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<UserInfoApiResponse> {
  try {
    if (!token.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequest(httpClient, config, config.endpoints.me, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });

    const data = await handleHttpResponse<UserInfoApiResponse>(response, '사용자 정보 조회에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 서비스 가용성 확인
 */
export async function checkEmailServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<ServiceAvailabilityApiResponse> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.health, {
      method: 'GET'
    });

    const data = await handleHttpResponse<ServiceAvailabilityApiResponse>(response, '서비스 가용성 확인에 실패했습니다.');
    return data;

  } catch (error) {
    return createNetworkErrorResponse();
  }
} 