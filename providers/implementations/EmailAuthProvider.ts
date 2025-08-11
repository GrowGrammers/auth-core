// 이메일 로그인 구현 - API 호출 로직이 외부 모듈로 분리된 버전
import { Token, UserInfo, BaseResponse, ApiConfig } from '../../shared/types';
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig } from '../interfaces/config/auth-config';
import { 
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  EmailLoginRequest,
  EmailVerificationRequest,
  EmailVerificationResponse
} from '../interfaces/dtos/auth.dto';
import { ILoginProvider, IEmailVerifiable } from '../interfaces';
import {
  loginByEmail,
  logoutByEmail,
  refreshTokenByEmail,
  validateTokenByEmail,
  getUserInfoByEmail,
  requestEmailVerification,
  checkEmailServiceAvailability
} from '../../network';

export class EmailAuthProvider implements ILoginProvider, IEmailVerifiable {
  readonly providerName = 'email' as const;
  readonly config: AuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;
  
  constructor(config: AuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig) {
    this.config = config;
    this.httpClient = httpClient;
    this.apiConfig = apiConfig;
  }

  /**
   * 공통 응답 생성 메서드 - 제네릭을 사용하여 타입 안전성 확보
   */
  protected createResponse<T extends BaseResponse>(
    success: boolean, 
    message: string,
    error?: string, 
    additionalData?: Partial<T>
  ): T {
    return {
      success,
      message,
      error,
      ...additionalData
    } as T;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const apiResponse = await loginByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createResponse<LoginResponse>(
        false,
        apiResponse.error || '로그인에 실패했습니다.',
        apiResponse.error
      );
    }

    return this.createResponse<LoginResponse>(
      true,
      '로그인에 성공했습니다.',
      undefined,
      apiResponse.data
    );
  }

  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    const apiResponse = await logoutByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createResponse<LogoutResponse>(
        false,
        apiResponse.error || '로그아웃에 실패했습니다.',
        apiResponse.error
      );
    }

    return this.createResponse<LogoutResponse>(true, '로그아웃에 성공했습니다.');
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const apiResponse = await refreshTokenByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createResponse<RefreshTokenResponse>(
        false,
        apiResponse.error || '토큰 갱신에 실패했습니다.',
        apiResponse.error
      );
    }

    return this.createResponse<RefreshTokenResponse>(
      true,
      '토큰 갱신에 성공했습니다.',
      undefined,
      apiResponse.data
    );
  }

  async validateToken(token: Token): Promise<boolean> {
    return await validateTokenByEmail(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfo | null> {
    return await getUserInfoByEmail(this.httpClient, this.apiConfig, token);
  }

  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    const apiResponse = await requestEmailVerification(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createResponse<EmailVerificationResponse>(
        false,
        apiResponse.error || '이메일 인증번호 요청에 실패했습니다.',
        apiResponse.error
      );
    }

    return this.createResponse<EmailVerificationResponse>(true, '이메일 인증번호가 전송되었습니다.');
  }

  async isAvailable(): Promise<boolean> {
    return await checkEmailServiceAvailability(this.httpClient, this.apiConfig);
  }
} 