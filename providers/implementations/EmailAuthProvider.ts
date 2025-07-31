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
  EmailLoginRequest
} from '../interfaces/AuthProvider';
import { BaseAuthProvider } from '../base/BaseAuthProvider';

export class EmailAuthProvider extends BaseAuthProvider {
  readonly providerName = 'email' as const;
  readonly config: AuthProviderConfig;
  
  constructor(config: AuthProviderConfig) {
    super();
    this.config = config;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // 타입 가드로 이메일 로그인 요청인지 확인
      if (request.provider !== 'email') {
        return this.createErrorResponse(
          '잘못된 인증 제공자입니다.',
          'INVALID_PROVIDER'
        );
      }

      const emailRequest = request as EmailLoginRequest;

      // 이메일 로그인 검증
      if (!emailRequest.email || !emailRequest.password) {
        return this.createErrorResponse(
          '이메일과 비밀번호가 필요합니다.',
          'INVALID_CREDENTIALS'
        );
      }

      // API 호출 (공통 HTTP 로직 사용)
      const response = await this.makeRequestWithRetry('/auth/login', {
        method: 'POST',
        body: {
          email: emailRequest.email,
          password: emailRequest.password,
          rememberMe: emailRequest.rememberMe
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return this.createErrorResponse(
          data.message || '로그인에 실패했습니다.',
          data.errorCode
        );
      }

      // 토큰 생성
      const token: Token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined
      };

      // 사용자 정보 생성
      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        provider: 'email'
      };

      return this.createSuccessResponse(token, userInfo);

    } catch (error) {
      return this.createErrorResponse(
        '네트워크 오류가 발생했습니다.',
        'NETWORK_ERROR'
      );
    }
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    try {
      if (!request.token?.accessToken) {
        return this.createLogoutErrorResponse('토큰이 필요합니다.');
      }

      // 서버에 로그아웃 요청 (공통 HTTP 로직 사용)
      const response = await this.makeRequestWithRetry('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.token.accessToken}`,
        },
      });

      if (!response.ok) {
        return this.createLogoutErrorResponse('로그아웃에 실패했습니다.');
      }

      return { success: true };

    } catch (error) {
      return this.createLogoutErrorResponse('네트워크 오류가 발생했습니다.');
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

      const data = await response.json();

      if (!response.ok) {
        return this.createRefreshTokenErrorResponse(
          data.message || '토큰 갱신에 실패했습니다.'
        );
      }

      const token: Token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined
      };

      return this.createRefreshTokenSuccessResponse(token);

    } catch (error) {
      return this.createRefreshTokenErrorResponse('네트워크 오류가 발생했습니다.');
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