// 구글 로그인 구현 - API 호출 로직이 외부 모듈로 분리된 버전
import { AuthProviderConfig, LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, RefreshTokenRequest, RefreshTokenResponse } from '../interfaces/AuthProvider';
import { ILoginProvider } from '../interfaces';
import { Token, UserInfo, BaseResponse } from '../../types';
import {
  loginByGoogle,
  logoutByGoogle,
  refreshTokenByGoogle,
  validateTokenByGoogle,
  getUserInfoByGoogle,
  checkGoogleServiceAvailability
} from '../../api';

export class GoogleAuthProvider implements ILoginProvider {
  readonly providerName = 'google' as const;
  readonly config: AuthProviderConfig;
  
  constructor(config: AuthProviderConfig) {
    this.config = config;
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