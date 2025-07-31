// 기본 인증 제공자 추상 클래스
import { Token, UserInfo } from '../../types';
import { 
  AuthProvider, 
  AuthProviderConfig, 
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
   * 공통 에러 응답 생성
   */
  protected createErrorResponse(error: string, errorCode?: string): LoginResponse {
    return {
      success: false,
      error,
      errorCode,
    };
  }

  /**
   * 공통 성공 응답 생성
   */
  protected createSuccessResponse(token: Token, userInfo: UserInfo): LoginResponse {
    return {
      success: true,
      token,
      userInfo,
    };
  }

  /**
   * 공통 로그아웃 에러 응답 생성
   */
  protected createLogoutErrorResponse(error: string): LogoutResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * 공통 토큰 갱신 에러 응답 생성
   */
  protected createRefreshTokenErrorResponse(error: string): RefreshTokenResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * 공통 토큰 갱신 성공 응답 생성
   */
  protected createRefreshTokenSuccessResponse(token: Token): RefreshTokenResponse {
    return {
      success: true,
      token,
    };
  }

  // 추상 메서드들 - 하위 클래스에서 구현
  abstract login(request: LoginRequest): Promise<LoginResponse>;
  abstract logout(request: LogoutRequest): Promise<LogoutResponse>;
  abstract refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
  abstract validateToken(token: Token): Promise<boolean>;
  abstract getUserInfo(token: Token): Promise<UserInfo | null>;
  abstract isAvailable(): Promise<boolean>;
} 