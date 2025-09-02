// Google OAuth 인증 제공자 구현
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig, GoogleAuthProviderConfig } from '../interfaces/config/auth-config';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { Token, UserInfo, BaseResponse, ApiConfig } from '../../shared/types';
import {
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  LoginApiResponse,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  ServiceAvailabilityApiResponse,
  LoginResponseData
} from '../interfaces/dtos/auth.dto';
import { ILoginProvider } from '../interfaces';
import {
  loginByGoogle,
  logoutByGoogle,
  refreshTokenByGoogle
} from '../../network';
import { 
  checkGoogleServiceAvailability,
  validateTokenByGoogle,
  getUserInfoByGoogle
} from '../../network/googleAuthApi';

export class GoogleAuthProvider extends BaseAuthProvider implements ILoginProvider {
  readonly providerName = 'google' as const;
  readonly config: GoogleAuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;

  constructor(config: GoogleAuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig) {
    super();
    this.config = config;
    this.httpClient = httpClient;
    this.apiConfig = apiConfig;
  }

  async login(request: LoginRequest): Promise<LoginApiResponse> {
    // OAuth 로그인 요청 타입 가드
    if (!('authCode' in request)) {
      return this.createErrorResponse(
        'OAuth 로그인 요청이 아닙니다.',
        'GoogleAuthProvider는 OAuth 로그인 요청만 지원합니다.'
      );
    }

    // authCode를 googleToken으로 변환하여 백엔드 API 호출
    const googleLoginRequest = {
      ...request,
      googleToken: request.authCode // authCode를 googleToken으로 매핑
    };

    const apiResponse = await loginByGoogle(this.httpClient, this.apiConfig, googleLoginRequest);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByGoogle(this.httpClient, this.apiConfig, request);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByGoogle(this.httpClient, this.apiConfig, request);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 토큰 검증
    return validateTokenByGoogle(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 사용자 정보 조회
    return getUserInfoByGoogle(this.httpClient, this.apiConfig, token);
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    try {
      return await checkGoogleServiceAvailability(this.httpClient, this.apiConfig);
    } catch (error) {
      return this.createErrorResponse(
        'Google 서비스 가용성 확인 중 오류가 발생했습니다.',
        '서비스 상태 확인 중 오류가 발생했습니다.'
      );
    }
  }
}