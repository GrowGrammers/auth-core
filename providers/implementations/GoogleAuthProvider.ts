// 구글 로그인 구현 (추후 구현 예정)
// TODO: Google OAuth 2.0 구현
// - OAuth 인증 코드 교환
// - Google 사용자 정보 조회
// - 서버 토큰 발급

import { AuthProviderConfig, LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, RefreshTokenRequest, RefreshTokenResponse } from '../interfaces/AuthProvider';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { Token, UserInfo } from '../../types';

export class GoogleAuthProvider extends BaseAuthProvider {
  readonly providerName = 'google' as const;
  readonly config: AuthProviderConfig;
  
  constructor(config: AuthProviderConfig) {
    super();
    this.config = config;
  }

  // TODO: 구현 예정
  async login(request: LoginRequest): Promise<LoginResponse> {
    throw new Error('GoogleAuthProvider는 아직 구현되지 않았습니다.');
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    throw new Error('GoogleAuthProvider는 아직 구현되지 않았습니다.');
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    throw new Error('GoogleAuthProvider는 아직 구현되지 않았습니다.');
  }

  async validateToken(token: Token): Promise<boolean> {
    throw new Error('GoogleAuthProvider는 아직 구현되지 않았습니다.');
  }

  async getUserInfo(token: Token): Promise<UserInfo | null> {
    throw new Error('GoogleAuthProvider는 아직 구현되지 않았습니다.');
  }

  async isAvailable(): Promise<boolean> {
    return false; // 아직 구현되지 않음
  }
}