// 인증 관련 네트워크 요청을 구성·처리하는 유틸 함수 모음
import { ApiConfig, RequestOptions, Token, UserInfo, AuthProviderType, ErrorResponse, SuccessResponse } from '../../shared/types';
import { HttpClient, HttpRequestConfig, HttpResponse } from '../interfaces/HttpClient';

/**
 * 공통 HTTP 요청 함수
 */
export async function makeRequest(
  httpClient: HttpClient,
  config: ApiConfig,
  endpoint: string, 
  options: RequestOptions
): Promise<HttpResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || config.timeout || 10000);

  try {
  
    const httpConfig: HttpRequestConfig = {
      url: `${config.apiBaseUrl}${endpoint}`, // apiBaseUrl로 수정
      method: options.method,
      headers: {
        //'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body,
      timeout: options.timeout || config.timeout || 10000,
    };
    const response = await httpClient.request(httpConfig);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 재시도 로직이 포함된 HTTP 요청 함수
 */
export async function makeRequestWithRetry(
  httpClient: HttpClient,
  config: ApiConfig,
  endpoint: string, 
  options: RequestOptions
): Promise<HttpResponse> {
  const maxRetries = config.retryCount || 3;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeRequest(httpClient, config, endpoint, options);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 지수 백오프: 1초, 2초, 4초...
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }

  throw lastError!;
}

/**
 * 백엔드 BaseResponse 응답 처리 함수 - 백엔드 응답을 그대로 반환
 */
export async function handleHttpResponse<T>(
  response: HttpResponse,
  errorMessage: string
): Promise<T> {
  try {
    const data = await response.json();
  
    // 백엔드가 BaseResponse 형태로 응답을 보내는 경우 (성공/실패 모두 포함)
    if (data && typeof data === 'object' && 'success' in data) {
      return data as T; // 백엔드 응답을 그대로 반환 (success: false인 경우도 포함)
    }
    
    // HTTP 에러 상태이지만 응답 데이터가 있는 경우
    if (!response.ok) {
      // 일반적인 HTTP 에러 응답을 BaseResponse 형태로 변환
      return {
        success: false,
        message: data.message || errorMessage,
        data: null,
        error: data.message || errorMessage
      } as T;
    }
    
    // 백엔드가 raw 데이터를 보내는 경우 (하위 호환성)
    return data as T;
  } catch (error) {
    // JSON 파싱 실패 시
    if (!response.ok) {
      return {
        success: false,
        message: errorMessage,
        data: null,
        error: errorMessage
      } as T;
    }
    throw new Error('응답 데이터 파싱에 실패했습니다.');
  }
}

/**
 * 토큰 생성 헬퍼 함수
 */
export function createToken(data: { accessToken: string; refreshToken: string; expiredAt?: number }): Token {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiredAt: data.expiredAt ? Date.now() + data.expiredAt * 1000 : undefined
  };
}

/**
 * 사용자 정보 생성 헬퍼 함수
 */
export function createUserInfo(data: { id: string; email: string; name: string }, provider: AuthProviderType): UserInfo {
  return {
    id: data.id,
    email: data.email,
    nickname: data.name,
    provider
  };
} 