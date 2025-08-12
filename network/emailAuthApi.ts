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
  ServiceAvailabilityApiResponse
} from '../providers/interfaces/dtos/auth.dto';
import { makeRequest, makeRequestWithRetry, handleHttpResponse, createToken, createUserInfo } from './utils/httpUtils';
import { 
  createErrorResponse, 
  createNetworkErrorResponse, 
  createValidationErrorResponse,
  createTokenValidationErrorResponse,
  createUserInfoErrorResponse,
  createServiceAvailabilityErrorResponse,
  createServerErrorResponse
} from '../shared/utils/errorUtils';
import { Token, UserInfo } from '../shared/types';

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

    return handleHttpResponse(
      response,
      '인증번호 요청에 실패했습니다.',
      (error) => createErrorResponse(error),
      () => ({ success: true, data: undefined, message: '인증번호가 전송되었습니다.' })
    );

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 이메일 로그인
 */
export async function loginByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<LoginApiResponse> {
  try {
    // 타입 가드로 이메일 로그인 요청인지 확인
    if (request.provider !== 'email') {
      return createErrorResponse('잘못된 인증 제공자입니다.');
    }

    const emailRequest = request as EmailLoginRequest;

    // 이메일 로그인 검증
    if (!emailRequest.email || !emailRequest.verificationCode) {
      return createErrorResponse('이메일과 인증코드가 필요합니다.');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.login, {
      method: 'POST',
      body: {
        email: emailRequest.email,
        verificationCode: emailRequest.verificationCode,
        rememberMe: emailRequest.rememberMe
      }
    });

    return handleHttpResponse(
      response,
      '로그인에 실패했습니다.',
      (error: string) => createErrorResponse(error),
      (data: unknown) => {
        const typedData = data as { accessToken: string; refreshToken: string; expiresAt?: number; user: { id: string; email: string; name: string } };
        const token = createToken(typedData);
        const userInfo = createUserInfo(typedData.user, 'email');
        return { success: true, data: { token, userInfo }, message: '로그인에 성공했습니다.' };
      }
    );

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 이메일 로그아웃
 */
export async function logoutByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<LogoutApiResponse> {
  try {
    if (!request.token?.accessToken) {
      return createValidationErrorResponse('액세스 토큰');
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.logout, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.token.accessToken}`,
      }
    });

    return handleHttpResponse(
      response,
      '로그아웃에 실패했습니다.',
      (error: string) => createErrorResponse(error),
      () => ({ success: true, data: undefined, message: '로그아웃에 성공했습니다.' })
    );

  } catch (error) {
    return createNetworkErrorResponse();
  }
}

/**
 * 토큰 갱신
 */
export async function refreshTokenByEmail(
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

    return handleHttpResponse(
      response,
      '토큰 갱신에 실패했습니다.',
      (error: string) => createErrorResponse(error),
              (data: unknown) => {
          const typedData = data as { accessToken: string; refreshToken: string; expiresAt?: number };
          const token = createToken(typedData);
          return { success: true, data: token, message: '토큰 갱신에 성공했습니다.' };
        }
    );

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
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      }
    });

    if (response.ok) {
      return { success: true, data: true, message: '토큰이 유효합니다.' };
    } else {
      return createTokenValidationErrorResponse(`HTTP ${response.status}: ${response.statusText}`);
    }
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
        'Authorization': `Bearer ${token.accessToken}`,
      }
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return createServerErrorResponse(response.status);
      } else if (response.status === 401) {
        return createTokenValidationErrorResponse('인증이 필요합니다.');
      } else {
        return createUserInfoErrorResponse(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    try {
      const data = await response.json();
      const userInfo = createUserInfo(data, 'email');
      return { success: true, data: userInfo, message: '사용자 정보를 성공적으로 가져왔습니다.' };
    } catch (parseError) {
      return createUserInfoErrorResponse('응답 데이터 파싱에 실패했습니다.');
    }

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

    if (response.ok) {
      return { success: true, data: true, message: '서비스가 정상적으로 작동하고 있습니다.' };
    } else {
      if (response.status >= 500) {
        return createServerErrorResponse(response.status);
      } else {
        return createServiceAvailabilityErrorResponse(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  } catch (error) {
    return createNetworkErrorResponse();
  }
} 