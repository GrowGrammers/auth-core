// EmailAuthProvider를 위한 실제 HTTP 통신 함수 모음
import { HttpClient } from './interfaces/HttpClient';
import { 
  LoginRequest, 
  LogoutRequest, 
  RefreshTokenRequest,
  EmailVerificationRequest,
  EmailLoginRequest
} from '../providers/interfaces/dtos/auth.dto';
import { 
  makeRequestWithRetry, 
  makeRequest, 
  handleHttpResponse, 
  createToken, 
  createUserInfo 
} from './utils/httpUtils';
import { ApiConfig, ApiResponse, Token, UserInfo } from '../types';

/**
 * 이메일 인증번호 요청
 */
export async function requestEmailVerification(
  httpClient: HttpClient,
  config: ApiConfig,
  request: EmailVerificationRequest
): Promise<ApiResponse> {
  try {
    if (!request.email) {
      return {
        success: false,
        error: '이메일이 필요합니다.',
        message: '이메일이 필요합니다.',
        data: null
      };
    }

    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.requestVerification, {
      method: 'POST',
      body: { email: request.email }
    });

    return handleHttpResponse(
      response,
      '인증번호 요청에 실패했습니다.',
      (error) => ({ success: false, error, message: error, data: null }),
      () => ({ success: true, data: undefined, message: '인증번호가 전송되었습니다.' })
    );

  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * 이메일 로그인
 */
export async function loginByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<ApiResponse<{ token: Token; userInfo: UserInfo }>> {
  try {
    // 타입 가드로 이메일 로그인 요청인지 확인
    if (request.provider !== 'email') {
      return {
        success: false,
        error: '잘못된 인증 제공자입니다.',
        message: '잘못된 인증 제공자입니다.',
        data: null
      };
    }

    const emailRequest = request as EmailLoginRequest;

    // 이메일 로그인 검증
    if (!emailRequest.email || !emailRequest.verificationCode) {
      return {
        success: false,
        error: '이메일과 인증코드가 필요합니다.',
        message: '이메일과 인증코드가 필요합니다.',
        data: null
      };
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
      (error: string) => ({ success: false, error, message: error, data: null }),
      (data: unknown) => {
        const typedData = data as { accessToken: string; refreshToken: string; expiresAt?: number; user: { id: string; email: string; name: string } };
        const token = createToken(typedData);
        const userInfo = createUserInfo(typedData.user, 'email');
        return { success: true, data: { token, userInfo }, message: '로그인에 성공했습니다.' };
      }
    );

  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * 이메일 로그아웃
 */
export async function logoutByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LogoutRequest
): Promise<ApiResponse> {
  try {
    if (!request.token?.accessToken) {
      return {
        success: false,
        error: '토큰이 필요합니다.',
        message: '토큰이 필요합니다.',
        data: null
      };
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
      (error) => ({ success: false, error, message: error, data: null }),
      () => ({ success: true, data: undefined, message: '로그아웃에 성공했습니다.' })
    );

  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * 토큰 갱신
 */
export async function refreshTokenByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: RefreshTokenRequest
): Promise<ApiResponse<{ token: Token }>> {
  try {
    const response = await makeRequestWithRetry(httpClient, config, config.endpoints.refresh, {
      method: 'POST',
      body: { refreshToken: request.refreshToken }
    });

    return handleHttpResponse(
      response,
      '토큰 갱신에 실패했습니다.',
      (error: string) => ({ success: false, error, message: error, data: null }),
      (data: unknown) => {
        const typedData = data as { accessToken: string; refreshToken: string; expiresAt?: number };
        const token = createToken(typedData);
        return { success: true, data: { token }, message: '토큰이 갱신되었습니다.' };
      }
    );

  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * 토큰 검증
 */
export async function validateTokenByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<boolean> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.validate, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 사용자 정보 조회
 */
export async function getUserInfoByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  token: Token
): Promise<UserInfo | null> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.me, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return createUserInfo(data, 'email');

  } catch (error) {
    return null;
  }
}

/**
 * 서비스 가용성 확인
 */
export async function checkEmailServiceAvailability(
  httpClient: HttpClient,
  config: ApiConfig
): Promise<boolean> {
  try {
    const response = await makeRequest(httpClient, config, config.endpoints.health, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
} 