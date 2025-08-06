// 인증 관련 네트워크 요청을 구성·처리하는 유틸 함수 모음
import { ApiConfig, RequestOptions, ApiResponse, ApiSuccessResponse, ApiErrorResponse, Token, UserInfo, AuthProviderType } from '../../types';
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
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
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
 * 공통 HTTP 응답 처리 함수 - 타입 안전성 개선
 */
export async function handleHttpResponse<T>(
  response: HttpResponse,
  errorMessage: string,
  createErrorResponse: (error: string, errorCode?: string) => ApiErrorResponse,
  createSuccessResponse: (data: unknown) => ApiSuccessResponse<T>
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    try {
      const data = await response.json();
      return createErrorResponse(
        data.message || errorMessage,
        data.errorCode
      );
    } catch {
      return createErrorResponse(errorMessage, 'UNKNOWN_ERROR');
    }
  }

  try {
    const data = await response.json();
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse('응답 데이터 파싱에 실패했습니다.', 'PARSE_ERROR');
  }
}

/**
 * 토큰 생성 헬퍼 함수
 */
export function createToken(data: { accessToken: string; refreshToken: string; expiresAt?: number }): Token {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined
  };
}

/**
 * 사용자 정보 생성 헬퍼 함수
 */
export function createUserInfo(data: { id: string; email: string; name: string }, provider: AuthProviderType): UserInfo {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    provider
  };
} 