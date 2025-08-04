// 구글 로그인 구현 - API 호출 로직이 외부 모듈로 분리된 버전
import { AuthProviderConfig, LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, RefreshTokenRequest, RefreshTokenResponse, EmailVerificationRequest, EmailVerificationResponse } from '../interfaces/AuthProvider';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { Token, UserInfo } from '../../types';
import {
  loginByGoogle,
  logoutByGoogle,
  refreshTokenByGoogle,
  validateTokenByGoogle,
  getUserInfoByGoogle,
  checkGoogleServiceAvailability
} from '../../api';

export class GoogleAuthProvider extends BaseAuthProvider {
  readonly providerName = 'google' as const;
  readonly config: AuthProviderConfig;
  
  constructor(config: AuthProviderConfig) {
    super();
    this.config = config;
  }

  // OAuth 제공자는 이메일 인증코드를 지원하지 않음
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    return this.createResponse<EmailVerificationResponse>(
      false,
      'Google OAuth는 이메일 인증코드를 지원하지 않습니다.',
      'UNSUPPORTED_FEATURE'
    );
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const apiResponse = await loginByGoogle(this.config, request);
    
    if (!apiResponse.success) {
      return this.createResponse<LoginResponse>(
        false,
        apiResponse.error,
        apiResponse.errorCode
      );
    }

    return this.createResponse<LoginResponse>(
      true,
      undefined,
      undefined,
      apiResponse.data
    );
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const apiResponse = await logoutByGoogle(this.config, request);
    
    if (!apiResponse.success) {
      return this.createResponse<LogoutResponse>(
        false,
        apiResponse.error,
        apiResponse.errorCode
      );
    }

    return this.createResponse<LogoutResponse>(true);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const apiResponse = await refreshTokenByGoogle(this.config, request);
    
    if (!apiResponse.success) {
      return this.createResponse<RefreshTokenResponse>(
        false,
        apiResponse.error,
        apiResponse.errorCode
      );
    }

    return this.createResponse<RefreshTokenResponse>(
      true,
      undefined,
      undefined,
      apiResponse.data
    );
  }

  async validateToken(token: Token): Promise<boolean> {
    return validateTokenByGoogle(this.config, token);
  }

  async getUserInfo(token: Token): Promise<UserInfo | null> {
    return getUserInfoByGoogle(this.config, token);
  }

  async isAvailable(): Promise<boolean> {
    return checkGoogleServiceAvailability(this.config);
  }
}