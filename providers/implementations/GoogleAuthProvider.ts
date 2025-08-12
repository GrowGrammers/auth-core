// Google OAuth 인증 제공자 구현
import { HttpClient } from '../../network/interfaces';
import { AuthProviderConfig } from '../interfaces/config/auth-config';
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
  ServiceAvailabilityApiResponse
} from '../interfaces/dtos/auth.dto';
import { ILoginProvider } from '../interfaces';
import { 
  loginByGoogle, 
  logoutByGoogle, 
  refreshTokenByGoogle 
} from '../../network';

export class GoogleAuthProvider extends BaseAuthProvider implements ILoginProvider {
  readonly providerName = 'google' as const;
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
    const apiResponse = await loginByGoogle(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || 'Google 로그인에 실패했습니다.',
        apiResponse.error || 'Google 로그인에 실패했습니다.'
      );
    }

    return this.createSuccessResponse<{ token: Token; userInfo: UserInfo }>(
      'Google 로그인에 성공했습니다.',
      apiResponse.data
    );
  }

  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    const apiResponse = await logoutByGoogle(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || 'Google 로그아웃에 실패했습니다.',
        apiResponse.error || 'Google 로그아웃에 실패했습니다.'
      );
    }

    return this.createSuccessResponse<void>('Google 로그아웃에 성공했습니다.', undefined);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    const apiResponse = await refreshTokenByGoogle(this.httpClient, this.apiConfig, request);
    
    if (!apiResponse.success) {
      return this.createErrorResponse(
        apiResponse.error || 'Google 토큰 갱신에 실패했습니다.',
        apiResponse.error || 'Google 토큰 갱신에 실패했습니다.'
      );
    }

    // apiResponse.data는 Token 형태
    return this.createSuccessResponse<Token>(
      'Google 토큰 갱신에 성공했습니다.',
      apiResponse.data
    );
  }

  async validateToken(token: Token): Promise<TokenValidationApiResponse> {
    // Google 토큰 검증 로직 구현
    // TODO: v2.0에서 Google OAuth 구현
    return this.createErrorResponse(
      'Google 토큰 검증은 아직 구현되지 않았습니다.',
      'Google 토큰 검증은 아직 구현되지 않았습니다.'
    );
  }

  async getUserInfo(token: Token): Promise<UserInfoApiResponse> {
    // Google 사용자 정보 조회 로직 구현
    // TODO: v2.0에서 Google OAuth 구현
    return this.createErrorResponse(
      'Google 사용자 정보 조회는 아직 구현되지 않았습니다.',
      'Google 사용자 정보 조회는 아직 구현되지 않았습니다.'
    );
  }

  async isAvailable(): Promise<ServiceAvailabilityApiResponse> {
    // Google 서비스 가용성 확인 로직 구현
    // TODO: v2.0에서 Google OAuth 구현
    return this.createErrorResponse(
      'Google 서비스 가용성 확인은 아직 구현되지 않았습니다.',
      'Google 서비스 가용성 확인은 아직 구현되지 않았습니다.'
    );
  }
}