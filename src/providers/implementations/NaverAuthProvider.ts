// Naver OAuth 인증 제공자 구현
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig, NaverAuthProviderConfig } from '../interfaces/config/auth-config';
import { BaseAuthProvider } from '../base/BaseAuthProvider';
import { Token, UserInfo, BaseResponse, ApiConfig, ClientPlatformType } from '../../shared/types';
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
  loginByNaver,
  logoutByNaver,
  refreshTokenByNaver
} from '../../network';
import { 
  checkNaverServiceAvailability,
  validateTokenByNaver,
  getUserInfoByNaver
} from '../../network/naverAuthApi';

export class NaverAuthProvider extends BaseAuthProvider implements ILoginProvider {
  readonly providerName = 'naver' as const;
  readonly config: NaverAuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;
  private platform: ClientPlatformType;

  constructor(config: NaverAuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig, platform: ClientPlatformType = 'web') {
    super();
    this.config = config;
    this.httpClient = httpClient;
    this.apiConfig = apiConfig;
    this.platform = platform;
  }

  async login(request: LoginRequest): Promise<LoginApiResponse> {
    // OAuth 로그인 요청 타입 가드
    if (!('authCode' in request)) {
      return this.createErrorResponse(
        'OAuth 로그인 요청이 아닙니다.',
        'NaverAuthProvider는 OAuth 로그인 요청만 지원합니다.'
      );
    }

    // authCode를 직접 사용하여 백엔드 API 호출
    const apiResponse = await loginByNaver(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByNaver(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByNaver(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 토큰 검증
    return validateTokenByNaver(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 사용자 정보 조회
    return getUserInfoByNaver(this.httpClient, this.apiConfig, token);
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    try {
      return await checkNaverServiceAvailability(this.httpClient, this.apiConfig);
    } catch (error) {
      return this.createErrorResponse(
        'Naver 서비스 가용성 확인 중 오류가 발생했습니다.',
        '서비스 상태 확인 중 오류가 발생했습니다.'
      );
    }
  }
}
