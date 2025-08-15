import { ILoginProvider, IEmailVerifiable } from '../../src/providers/interfaces';
import { AuthProviderConfig } from '../../src/providers/interfaces/config/auth-config';
import { 
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  EmailVerificationApiResponse
} from '../../src/providers/interfaces/dtos/auth.dto';
import { Token, UserInfo } from '../../src/shared/types';
import { createSuccessResponse, createErrorResponse } from '../../src/shared/utils';

export class FakeAuthProvider implements ILoginProvider, IEmailVerifiable {
  readonly providerName = "fake";
  readonly config: AuthProviderConfig = {
    timeout: 5000,
    retryCount: 2
  };

  // 테스트용 상태 관리
  private isLoggedIn = false;
  private currentUser: UserInfo | null = null;
  private currentToken: Token | null = null;

  async login(request: LoginRequest): Promise<LoginApiResponse> {
    // 이메일 로그인 요청인지 확인
    if ('email' in request) {
      // 테스트용 실패 시나리오
      if (request.email === 'fail@example.com') {
        return {
        success: false,
        message: '로그인 실패: 잘못된 이메일',
        data: null,
        error: '로그인 실패: 잘못된 이메일'
      };
      }

      if (request.email === 'timeout@example.com') {
        await new Promise(resolve => setTimeout(resolve, 100)); // 짧은 지연으로 시뮬레이션
        return {
          success: false,
          message: '로그인 실패: 타임아웃',
          data: null,
          error: '로그인 실패: 타임아웃'
        };
      }

      // 성공 시나리오
      this.isLoggedIn = true;
      this.currentUser = {
        id: 'u1',
        email: request.email,
        nickname: '테스트 사용자',
        provider: 'email'
      };
      
      this.currentToken = {
        accessToken: 'fake-access-token-123',
        refreshToken: 'fake-refresh-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      };

      const response: LoginResponse = {
        success: true,
        message: '로그인 성공',
        data: {
          token: this.currentToken,
          userInfo: this.currentUser
        }
      };

      return response;
    }

    // OAuth 로그인은 지원하지 않음
    return {
      success: false,
      message: '지원하지 않는 로그인 방식입니다.',
      data: null,
      error: '지원하지 않는 로그인 방식입니다.'
    };
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.currentToken = null;

    const response: LogoutResponse = {
      success: true,
      message: '로그아웃 성공',
      data: undefined
    };

    return response;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    if (request.refreshToken !== 'fake-refresh-token-123') {
      return {
        success: false,
        message: '리프레시 토큰이 유효하지 않습니다.',
        data: null,
        error: '리프레시 토큰이 유효하지 않습니다.'
      };
    }

    const newToken: Token = {
      accessToken: 'fake-access-token-456',
      refreshToken: 'fake-refresh-token-123',
      expiresAt: Math.floor(Date.now() / 1000) + 3600
    };

    this.currentToken = newToken;

    const response: RefreshTokenResponse = {
      success: true,
      message: '토큰 갱신 성공',
      data: newToken
    };

    return response;
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    if (token.accessToken === 'fake-access-token-123' || token.accessToken === 'fake-access-token-456') {
      return {
        success: true,
        message: '토큰이 유효합니다.',
        data: true
      };
    }
    return {
      success: true,
      message: '토큰이 유효하지 않습니다.',
      data: false
    };
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    if (!this.currentUser) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
        data: null,
        error: '사용자 정보를 찾을 수 없습니다.'
      };
    }
    return {
      success: true,
      message: '사용자 정보 조회 성공',
      data: this.currentUser
    };
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    return {
      success: true,
      message: '서비스 사용 가능',
      data: true
    };
  }

  // IEmailVerifiable 구현
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse> {
    if (request.email === 'invalid@example.com') {
      return {
        success: false,
        message: '이메일 인증 요청 실패',
        data: null,
        error: '이메일 인증 요청 실패'
      };
    }

    const response: EmailVerificationResponse = {
      success: true,
      message: '인증번호가 이메일로 전송되었습니다.',
      data: undefined
    };

    return response;
  }

  // 테스트 헬퍼 메서드들
  getCurrentState() {
    return {
      isLoggedIn: this.isLoggedIn,
      currentUser: this.currentUser,
      currentToken: this.currentToken
    };
  }

  reset() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.currentToken = null;
  }
}
