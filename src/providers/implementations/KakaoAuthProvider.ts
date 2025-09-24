// Kakao OAuth 인증 제공자 구현
import { HttpClient } from '../../network/interfaces/HttpClient';
import { AuthProviderConfig, KakaoAuthProviderConfig } from '../interfaces/config/auth-config';
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
  loginByKakao,
  logoutByKakao,
  refreshTokenByKakao
} from '../../network';
import { 
  checkKakaoServiceAvailability,
  validateTokenByKakao,
  getUserInfoByKakao
} from '../../network/kakaoAuthApi';

export class KakaoAuthProvider extends BaseAuthProvider implements ILoginProvider {
  readonly providerName = 'kakao' as const;
  readonly config: KakaoAuthProviderConfig;
  private httpClient: HttpClient;
  private apiConfig: ApiConfig;
  private platform: ClientPlatformType;

  constructor(config: KakaoAuthProviderConfig, httpClient: HttpClient, apiConfig: ApiConfig, platform: ClientPlatformType = 'web') {
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
        'KakaoAuthProvider는 OAuth 로그인 요청만 지원합니다.'
      );
    }

    // authCode를 직접 사용하여 백엔드 API 호출
    const apiResponse = await loginByKakao(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByKakao(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByKakao(this.httpClient, this.apiConfig, request, this.platform);
    
    // 백엔드 응답을 그대로 반환 (성공/실패 모두)
    return apiResponse;
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 토큰 검증
    return validateTokenByKakao(this.httpClient, this.apiConfig, token);
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    // 백엔드 OAuth 엔드포인트를 통해 사용자 정보 조회
    return getUserInfoByKakao(this.httpClient, this.apiConfig, token);
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    try {
      return await checkKakaoServiceAvailability(this.httpClient, this.apiConfig);
    } catch (error) {
      return this.createErrorResponse(
        'Kakao 서비스 가용성 확인 중 오류가 발생했습니다.',
        '서비스 상태 확인 중 오류가 발생했습니다.'
      );
    }
  }
}
