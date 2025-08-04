// 구글 로그인 구현 (추후 구현 예정)
// TODO: Google OAuth 2.0 구현
// - OAuth 인증 코드 교환
// - Google 사용자 정보 조회
// - 서버 토큰 발급

import { AuthProviderConfig, LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, RefreshTokenRequest, RefreshTokenResponse, EmailVerificationRequest, EmailVerificationResponse } from '../interfaces/AuthProvider';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { Token, UserInfo, BaseResponse } from '../../types';

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
    // TODO: OAuth 인증 코드를 받아서 토큰으로 교환하는 로직 구현
    return this.createResponse<LoginResponse>(
      false,
      'GoogleAuthProvider는 아직 구현되지 않았습니다.',
      'NOT_IMPLEMENTED'
    );
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    // TODO: Google OAuth 로그아웃 구현
    return this.createResponse<LogoutResponse>(
      false,
      'GoogleAuthProvider는 아직 구현되지 않았습니다.',
      'NOT_IMPLEMENTED'
    );
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // TODO: Google OAuth 토큰 갱신 구현
    return this.createResponse<RefreshTokenResponse>(
      false,
      'GoogleAuthProvider는 아직 구현되지 않았습니다.',
      'NOT_IMPLEMENTED'
    );
  }

  async validateToken(token: Token): Promise<boolean> {
    // TODO: Google OAuth 토큰 검증 구현
    return false;
  }

  async getUserInfo(token: Token): Promise<UserInfo | null> {
    // TODO: Google OAuth 사용자 정보 조회 구현
    return null;
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Google OAuth 서비스 가용성 확인
    return false;
  }
}