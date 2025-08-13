// 이메일 로그인 구현 - API 호출 로직이 외부 모듈로 분리된 버전
import { Token, UserInfo, ApiConfig } from '../../shared/types';
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig } from '../interfaces/config/auth-config';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { 
  LoginRequest, 
  LogoutRequest, 
  RefreshTokenRequest,
  EmailVerificationRequest,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  EmailVerificationApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse
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

export class EmailAuthProvider extends BaseAuthProvider implements ILoginProvider, IEmailVerifiable {
  readonly providerName = 'email' as const;
  readonly config: AuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;
  
  constructor(config: AuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig) {
    super();
    this.config = config;
    this.httpClient = httpClient;
    this.apiConfig = apiConfig;
  }

  async login(request: LoginRequest): Promise<LoginApiResponse> {
    const apiResponse = await loginByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || '로그인에 실패했습니다.',
        apiResponse.error || '로그인에 실패했습니다.'
      );
    }

    // apiResponse.data는 { token: Token; userInfo: UserInfo } 형태
    return this.createSuccessResponse<{ token: Token; userInfo: UserInfo }>(
      '로그인에 성공했습니다.',
      apiResponse.data
    );
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || '로그아웃에 실패했습니다.',
        apiResponse.error || '로그아웃에 실패했습니다.'
      );
    }

    return this.createSuccessResponse<void>('로그아웃에 성공했습니다.', undefined);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByEmail(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || '토큰 갱신에 실패했습니다.',
        apiResponse.error || '토큰 갱신에 실패했습니다.'
      );
    }

    // apiResponse.data는 Token 형태
    return this.createSuccessResponse<Token>(
      '토큰 갱신에 성공했습니다.',
      apiResponse.data
    );
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    return await validateTokenByEmail(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    return await getUserInfoByEmail(this.httpClient, this.apiConfig, token);
  }

  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse> {
    const apiResponse = await requestEmailVerification(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || '이메일 인증번호 요청에 실패했습니다.',
        apiResponse.error || '이메일 인증번호 요청에 실패했습니다.'
      );
    }

    return this.createSuccessResponse<void>('이메일 인증번호가 전송되었습니다.', undefined);
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    return await checkEmailServiceAvailability(this.httpClient, this.apiConfig);
  }
} 