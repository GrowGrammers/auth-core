// 기본 인증 제공자 추상 클래스 : 중복되는 공통 로직을 추출한 추상 클래스
import { Token, UserInfo, BaseResponse } from '../../types';
import { 
  AuthProvider, 
  AuthProviderConfig, 
  EmailVerificationRequest,
  EmailVerificationResponse,
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RequestOptions
} from '../interfaces/AuthProvider';

export abstract class BaseAuthProvider implements AuthProvider {
  abstract readonly providerName: AuthProvider['providerName'];
  abstract readonly config: AuthProviderConfig;

  /**
   * 공통 HTTP 요청 메서드
   */
  protected async makeRequest(endpoint: string, options: RequestOptions): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout || 10000);

    try {
      const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 재시도 로직이 포함된 HTTP 요청
   */
  protected async makeRequestWithRetry(endpoint: string, options: RequestOptions): Promise<Response> {
    const maxRetries = this.config.retryCount || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
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
   * 공통 응답 생성 메서드 - 제네릭을 사용하여 타입 안전성 확보
   */
  protected createResponse<T extends BaseResponse>(
    success: boolean, 
    error?: string, 
    errorCode?: string,
    additionalData?: Partial<T>
  ): T {
    return {
      success,
      error,
      errorCode,
      ...additionalData
    } as T;
  }

  /**
   * 공통 HTTP 응답 처리 - 성공/실패 판단 및 에러 응답 생성
   */
  protected async handleHttpResponse<T extends BaseResponse>(
    response: Response, 
    errorMessage: string,
    createErrorResponse: (error: string, errorCode?: string) => T
  ): Promise<T> {
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
    
    throw new Error('Response is ok but no success handler provided');
  }

  /**
   * 공통 HTTP 응답 처리 - 성공 시 데이터 반환
   */
  protected async handleHttpResponseWithData<T extends BaseResponse>(
    response: Response,
    errorMessage: string,
    createErrorResponse: (error: string, errorCode?: string) => T,
    successHandler: (data: any) => T
  ): Promise<T> {
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
      return successHandler(data);
    } catch (error) {
      return createErrorResponse('응답 데이터 파싱에 실패했습니다.', 'PARSE_ERROR');
    }
  }

  // 추상 메서드들 - 하위 클래스에서 구현
  abstract requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse>;
  abstract login(request: LoginRequest): Promise<LoginResponse>;
  abstract logout(request: LogoutRequest): Promise<LogoutResponse>;
  abstract refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
  abstract validateToken(token: Token): Promise<boolean>;
  abstract getUserInfo(token: Token): Promise<UserInfo | null>;
  abstract isAvailable(): Promise<boolean>;
} 