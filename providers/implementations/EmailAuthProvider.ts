// 이메일 로그인 구현 
import { Token, UserInfo } from '../../types';
import { 
  AuthProviderConfig,
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  EmailLoginRequest,
  EmailVerificationRequest,
  EmailVerificationResponse
} from '../interfaces/AuthProvider';
import { BaseAuthProvider } from '../base/BaseAuthProvider';

export class EmailAuthProvider extends BaseAuthProvider {
  readonly providerName = 'email' as const;
  readonly config: AuthProviderConfig;
  
  constructor(config: AuthProviderConfig) {
    super();
    this.config = config;
  }

  private createToken(data: { accessToken: string; refreshToken: string; expiresAt?: number }): Token {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined
    };
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // 타입 가드로 이메일 로그인 요청인지 확인
      if (request.provider !== 'email') {
        return this.createResponse<LoginResponse>(
          false,
          '잘못된 인증 제공자입니다.',
          'INVALID_PROVIDER'
        );
      }

      const emailRequest = request as EmailLoginRequest;

      // 이메일 로그인 검증
      if (!emailRequest.email || !emailRequest.verificationCode) {
        return this.createResponse<LoginResponse>(
          false,
          '이메일과 인증코드가 필요합니다.',
          'INVALID_CREDENTIALS'
        );
      }

      // API 호출 (공통 HTTP 로직 사용)
      const response = await this.makeRequestWithRetry('/auth/login', {
        method: 'POST',
        body: {
          email: emailRequest.email,
          verificationCode: emailRequest.verificationCode,
          rememberMe: emailRequest.rememberMe
        },
      });

      return this.handleHttpResponseWithData(
        response,
        '로그인에 실패했습니다.',
        (error, errorCode) => this.createResponse<LoginResponse>(false, error, errorCode),
        (data) => {
          const token: Token = this.createToken(data);
          const userInfo: UserInfo = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            provider: 'email'
          };
          return this.createResponse<LoginResponse>(true, undefined, undefined, { token, userInfo });
        }
      );

    } catch (error) {
      return this.createResponse<LoginResponse>(
        false,
        '네트워크 오류가 발생했습니다.',
        'NETWORK_ERROR'
      );
    }
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    try {
      if (!request.token?.accessToken) {
        return this.createResponse<LogoutResponse>(false, '토큰이 필요합니다.');
      }

      // 서버에 로그아웃 요청 (공통 HTTP 로직 사용)
      const response = await this.makeRequestWithRetry('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.token.accessToken}`,
        },
      });

      return this.handleHttpResponse(
        response,
        '로그아웃에 실패했습니다.',
        (error, errorCode) => this.createResponse<LogoutResponse>(false, error, errorCode)
      );

    } catch (error) {
      return this.createResponse<LogoutResponse>(false, '네트워크 오류가 발생했습니다.');
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const response = await this.makeRequestWithRetry('/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: request.refreshToken
        },
      });

      return this.handleHttpResponseWithData(
        response,
        '토큰 갱신에 실패했습니다.',
        (error, errorCode) => this.createResponse<RefreshTokenResponse>(false, error, errorCode),
        (data) => {
          const token: Token = this.createToken(data);
          return this.createResponse<RefreshTokenResponse>(true, undefined, undefined, { token });
        }
      );

    } catch (error) {
      return this.createResponse<RefreshTokenResponse>(false, '네트워크 오류가 발생했습니다.');
    }
  }

  async validateToken(token: Token): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getUserInfo(token: Token): Promise<UserInfo | null> {
    try {
      const response = await this.makeRequest('/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        provider: 'email'
      };

    } catch (error) {
      return null;
    }
  }

  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    try {
      if (!request.email) {
        return this.createResponse<EmailVerificationResponse>(
          false,
          '이메일이 필요합니다.',
          'INVALID_EMAIL'
        );
      }

      const response = await this.makeRequestWithRetry('/auth/request-verification', {
        method: 'POST',
        body: {
          email: request.email
        },
      });

      return this.handleHttpResponse(
        response,
        '인증번호 요청에 실패했습니다.',
        (error, errorCode) => this.createResponse<EmailVerificationResponse>(false, error, errorCode)
      );

    } catch (error) {
      return this.createResponse<EmailVerificationResponse>(
        false,
        '네트워크 오류가 발생했습니다.',
        'NETWORK_ERROR'
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
} 