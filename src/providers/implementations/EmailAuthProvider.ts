// 이메일 로그인 구현 - API 호출 로직이 외부 모듈로 분리된 버전
import { Token, UserInfo, ApiConfig, ClientPlatformType } from '../../shared/types';
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig } from '../interfaces/config/auth-config';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import {
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  EmailVerificationRequest,
  EmailVerificationApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse,
  LoginResponseData,
  EmailVerificationConfirmRequest,
  EmailVerificationConfirmApiResponse
} from '../interfaces/dtos/auth.dto';
import { ILoginProvider, IEmailVerifiable } from '../interfaces';
import {
  loginByEmail,
  logoutByEmail,
  refreshTokenByEmail,
  validateTokenByEmail,
  getUserInfoByEmail,
  requestEmailVerification,
  checkEmailServiceAvailability,
  verifyEmail
} from '../../network';

export class EmailAuthProvider extends BaseAuthProvider implements ILoginProvider, IEmailVerifiable {
  readonly providerName = 'email' as const;
  readonly config: AuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;
  private platform: ClientPlatformType;

  constructor(config: AuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig, platform: ClientPlatformType = 'web') {
    super();
    this.config = config;
    this.httpClient = httpClient;
    this.apiConfig = apiConfig;
    this.platform = platform;
  }

  async login(request: LoginRequest): Promise<LoginApiResponse> {
    const apiResponse = await loginByEmail(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByEmail(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByEmail(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    return await validateTokenByEmail(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    return await getUserInfoByEmail(this.httpClient, this.apiConfig, token);
  }

  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse> {
    const apiResponse = await requestEmailVerification(this.httpClient, this.apiConfig, request);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async verifyEmail(request: EmailVerificationConfirmRequest): Promise<EmailVerificationConfirmApiResponse> {
    const apiResponse = await verifyEmail(this.httpClient, this.apiConfig, request);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    return await checkEmailServiceAvailability(this.httpClient, this.apiConfig);
  }
} 