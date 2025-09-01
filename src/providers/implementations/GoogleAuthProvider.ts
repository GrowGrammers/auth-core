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
import { verifyGoogleAccessToken } from '../../shared/utils/googleOAuthUtils';

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
    // GoogleLoginRequest 타입 가드
    if (!('googleToken' in request)) {
      return this.createErrorResponse(
        '구글 로그인 요청이 아닙니다.',
        'GoogleAuthProvider는 GoogleLoginRequest 타입만 지원합니다.'
      );
    }

    const apiResponse = await loginByGoogle(this.httpClient, this.apiConfig, request);
    
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
    try {
      if (!token.accessToken) {
        return this.createErrorResponse(
          '액세스 토큰이 필요합니다.',
          '토큰 검증을 위해 액세스 토큰이 필요합니다.'
        );
      }

      // Google 액세스 토큰 검증
      const verifiedToken = await verifyGoogleAccessToken(
        token.accessToken,
        this.config.googleClientId
      );

      if (!verifiedToken) {
        return this.createErrorResponse(
          'Google 토큰 검증에 실패했습니다.',
          '제공된 토큰이 유효하지 않거나 만료되었습니다.'
        );
      }

      // 이메일 인증 여부 확인
      if (!verifiedToken.email_verified) {
        return this.createErrorResponse(
          '이메일이 인증되지 않았습니다.',
          'Google 계정의 이메일 인증이 필요합니다.'
        );
      }

      // 성공 응답 반환 (TokenValidationResponse는 boolean을 반환)
      return {
        success: true,
        message: 'Google 토큰 검증이 성공했습니다.',
        data: true
      };
    } catch (error) {
      console.error('Google 토큰 검증 중 오류 발생:', error);
      return this.createErrorResponse(
        'Google 토큰 검증 중 오류가 발생했습니다.',
        '토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.'
      );
    }
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