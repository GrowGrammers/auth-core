// 인증 + 저장 전략들을 주입받아 로그인 흐름 제어 
import { AuthProvider, IEmailVerifiable } from './providers/interfaces';
import { TokenStore } from './storage/TokenStore.interface';
import { Token, ApiConfig } from './shared/types';
import { createAuthProvider, isAuthProviderFactoryError } from './factories/AuthProviderFactory';
import { createTokenStore, isTokenStoreFactoryError } from './factories/TokenStoreFactory';
import { HttpClient } from './network/interfaces/HttpClient';
import { 
  EmailVerificationRequest,
  EmailVerificationApiResponse, 
  LoginRequest,
  LoginApiResponse, 
  LogoutRequest,
  LogoutApiResponse, 
  RefreshTokenRequest,
  RefreshTokenApiResponse,
  TokenValidationApiResponse,
  UserInfoApiResponse,
  EmailVerificationConfirmRequest,
  EmailVerificationConfirmApiResponse
} from './providers/interfaces/dtos/auth.dto';
import { createErrorResponse, createErrorResponseFromException, createSuccessResponse } from './shared/utils';
import { SuccessResponse, ErrorResponse } from './shared/types/common';

// AuthManager 공개 API 응답 타입들
export type GetTokenResponse = SuccessResponse<Token | null> | ErrorResponse;
export type IsAuthenticatedApiResponse = SuccessResponse<boolean> | ErrorResponse;
export type ClearResponse = SuccessResponse<void> | ErrorResponse;

export interface AuthManagerConfig {
  providerType?: 'email' | 'google'; // 팩토리를 통한 Provider 생성 (권장)
  provider?: AuthProvider; // 직접 Provider 인스턴스 주입 (테스트에 유리하나, 프로덕션에서는 DI/팩토리 레이어 통해 주입 권장)
  apiConfig: ApiConfig;
  httpClient: HttpClient;  // HttpClient를 필수로 추가
  tokenStore?: TokenStore; // 직접 TokenStore 인스턴스 제공 (선택사항)
  tokenStoreType?: 'web' | 'mobile' | 'fake'; // TokenStore 타입으로 팩토리에서 생성 (선택사항)
}

export class AuthManager {
  private provider: AuthProvider; // ① 어떤 방식(이메일, 구글...)으로 로그인할 건지 저장
  private tokenStore: TokenStore; // ② 어떤 방식으로 토큰을 저장할 건지 저장

  constructor(config: AuthManagerConfig) {
    // Provider 설정 검증
    if (!config.provider && !config.providerType) {
      throw new Error('[AuthManager] provider 또는 providerType 중 하나는 반드시 제공되어야 합니다.');
    }

    // 프로덕션 환경에서 직접 Provider 주입 시 경고
    if (process.env.NODE_ENV === 'production' && config.provider) {
      console.warn('[AuthManager] 프로덕션 환경에서 직접 Provider 주입은 권장하지 않습니다. providerType과 팩토리 패턴 사용을 고려해주세요.');
    }

    // Provider 생성 (우선순위: 직접 제공 > 타입으로 팩토리 생성)
    this.provider = config.provider ?? 
      this.createProvider(config.providerType as NonNullable<AuthManagerConfig['providerType']>, config.apiConfig, config.httpClient);
    
    // TokenStore 생성 (우선순위: 직접 제공 > 타입으로 팩토리 생성 > 기본값)
    this.tokenStore = config.tokenStore || this.createTokenStoreFromType(config.tokenStoreType);
  }

  private createProvider(providerType: 'email' | 'google', apiConfig: ApiConfig, httpClient: HttpClient): AuthProvider {
    // Provider 팩토리 로직 (apiConfig 주입)
    const config = { timeout: 10000, retryCount: 3 }; // 기본 설정
    
    const result = createAuthProvider(providerType, config, httpClient, apiConfig);
    
    // 타입 가드를 사용한 안전한 에러 처리
    if (isAuthProviderFactoryError(result)) {
      console.error('인증 제공자 생성 실패:', result.error);
      throw new Error(result.message);
    }
    
    // 여기서부터 result는 AuthProvider 타입으로 안전하게 좁혀짐
    return result;
  }

  private createTokenStoreFromType(tokenStoreType?: 'web' | 'mobile' | 'fake'): TokenStore {
    // 지정된 타입이 있으면 해당 타입으로, 없으면 기본값 'fake' 사용
    const type = tokenStoreType || 'fake';
    
    const result = createTokenStore(type);
    
    // 타입 가드를 사용한 안전한 에러 처리
    if (isTokenStoreFactoryError(result)) {
      console.error('토큰 저장소 생성 실패:', result.error);
      throw new Error(result.message);
    }
    
    // 여기서부터 result는 TokenStore 타입으로 안전하게 좁혀짐
    return result;
  }

  /**
   * 이메일 인증번호 요청.
   * @param request 이메일 인증번호 요청 정보
   * @returns 인증번호 요청 결과
   */
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse> {
    try {
      // ① 이메일 인증 가능한 제공자인지 확인
      if (!this.isEmailVerifiable(this.provider)) {
        return createErrorResponse('이메일 인증을 지원하지 않는 제공자입니다.');
      }

      // ② 이메일 인증 가능한 제공자로 캐스팅
      const emailProvider = this.provider as IEmailVerifiable;
      
      // ③ 이메일 인증번호 요청
      const verificationResponse = await emailProvider.requestEmailVerification(request);
      
      if (verificationResponse.success) {
        //console.log('[AuthManager] 인증번호 요청 성공');
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in verificationResponse ? verificationResponse.error : '알 수 없는 오류';
        //console.log('[AuthManager] 인증번호 요청 실패:', errorMessage);
      }
      
      return verificationResponse;
    } catch (error) {
      console.error('인증번호 요청 중 오류 발생:', error);
      return createErrorResponseFromException(error, '인증번호 요청 중 오류가 발생했습니다.');
    }
  }

  /**
   * 이메일 인증번호 확인.
   * @param request 이메일 인증번호 확인 정보
   * @returns 인증번호 확인 결과
   */
  async verifyEmail(request: EmailVerificationConfirmRequest): Promise<EmailVerificationConfirmApiResponse> {
    try {
      // ① 이메일 인증 가능한 제공자인지 확인
      if (!this.isEmailVerifiable(this.provider)) {
        return createErrorResponse('이메일 인증을 지원하지 않는 제공자입니다.');
      }

      // ② 이메일 인증 가능한 제공자로 캐스팅
      const emailProvider = this.provider as IEmailVerifiable;
      
      // ③ 이메일 인증번호 확인
      const verificationResponse = await emailProvider.verifyEmail(request);
      
      if (verificationResponse.success) {
        //console.log('[AuthManager] 이메일 인증 성공');
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in verificationResponse ? verificationResponse.error : '알 수 없는 오류';
        //console.log('[AuthManager] 이메일 인증 실패:', errorMessage);
      }
      
      return verificationResponse;
    } catch (error) {
      console.error('이메일 인증 중 오류 발생:', error);
      return createErrorResponseFromException(error, '이메일 인증 중 오류가 발생했습니다.');
    }
  }

  /**
   * 타입 가드: provider가 IEmailVerifiable을 구현했는지 확인
   */
  private isEmailVerifiable(provider: AuthProvider): provider is AuthProvider & IEmailVerifiable {
    return 'requestEmailVerification' in provider;
  }

  /**
   * 로그인 수행.
   * @param request 로그인 요청 정보
   * @returns 로그인 결과
   */
  async login(request: LoginRequest): Promise<LoginApiResponse> {
    try {
      // ④ 로그인 시도 (누가? 전달받은 provider가!)
      const loginResponse = await this.provider.login(request);
      
      if (loginResponse.success && loginResponse.data?.accessToken) {
        // ⑤ 로그인 성공 시 토큰 저장
        const token: Token = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
          expiredAt: loginResponse.data.expiredAt
        };
        const saveResult = await this.tokenStore.saveToken(token);
        if (saveResult.success) {
          //console.log('[AuthManager] 로그인 성공, 토큰 저장됨');
        } else {
          console.error('[AuthManager] 토큰 저장 실패:', saveResult.error);
        }
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in loginResponse ? loginResponse.error : '알 수 없는 오류';
        //console.log('[AuthManager] 로그인 실패:', errorMessage);
      }
      
      return loginResponse;
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      return createErrorResponseFromException(error, '로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 로그아웃 수행.
   * @param request 로그아웃 요청 정보
   * @returns 로그아웃 결과
   */
  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    try {
      // 저장된 토큰 가져오기
      const tokenResult = await this.tokenStore.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return createErrorResponse('저장된 토큰이 없습니다.');
      }
      
      // refreshToken이 있는지 확인
      if (!tokenResult.data.refreshToken) {
        return createErrorResponse('리프레시 토큰이 없습니다.');
      }
      
      // refreshToken을 request에 추가 (API 호출용)
      const logoutRequestWithRefreshToken: LogoutRequest = {
        ...request,
        refreshToken: tokenResult.data.refreshToken
      };
      
      // ⑦ 로그아웃 시도 (누가? 전달받은 provider가!)
      const logoutResponse = await this.provider.logout(logoutRequestWithRefreshToken);
      
      if (logoutResponse.success) {
        // ⑧ 로그아웃 성공 시 저장된 토큰 삭제
        const removeResult = await this.tokenStore.removeToken();
        if (removeResult.success) {
          //console.log('[AuthManager] 로그아웃 성공, 토큰 삭제됨');
        } else {
          console.error('[AuthManager] 토큰 삭제 실패:', removeResult.error);
        }
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in logoutResponse ? logoutResponse.error : '알 수 없는 오류';
        //console.log('[AuthManager] 로그아웃 실패:', errorMessage);
      }
      
      return logoutResponse;
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      return createErrorResponseFromException(error, '로그아웃 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 저장된 토큰 가져오기.
   * @returns 저장된 토큰 응답
   */
  async getToken(): Promise<GetTokenResponse> {
    try {
      const result = await this.tokenStore.getToken();
      return result;
    } catch (error) {
      console.error('토큰 가져오기 중 오류 발생:', error);
      return createErrorResponseFromException(error, '토큰 가져오기 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 갱신.
   * @param request 토큰 갱신 요청 정보
   * @returns 토큰 갱신 결과
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse> {
    try {
      const refreshResponse = await this.provider.refreshToken(request);
      
      if (refreshResponse.success && refreshResponse.data) {
        // 토큰 갱신 성공 시 새로운 토큰 저장
        const saveResult = await this.tokenStore.saveToken(refreshResponse.data);
        if (saveResult.success) {
          //console.log('[AuthManager] 토큰 갱신 성공, 새 토큰 저장됨');
        } else {
          console.error('[AuthManager] 새 토큰 저장 실패:', saveResult.error);
        }
      }
      
      return refreshResponse;
    } catch (error) {
      console.error('토큰 갱신 중 오류 발생:', error);
      return createErrorResponseFromException(error, '토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  /**
   * 현재 토큰의 유효성 검증.
   * @returns 유효성 검증 결과
   */
  async validateCurrentToken(): Promise<TokenValidationApiResponse> {
    const tokenResult = await this.getToken();
    if (!tokenResult.success || !tokenResult.data) {
      return createErrorResponse('저장된 토큰이 없습니다.');
    }
    
    // 토큰이 만료되었는지 먼저 확인
    const expiredResult = await this.tokenStore.isTokenExpired();
    if (expiredResult.success && expiredResult.data) {
      return createErrorResponse('토큰이 만료되었습니다.');
    }
    
    // Provider를 통해 토큰 유효성 검증
    return await this.provider.validateToken(tokenResult.data);
  }

  /**
   * 사용자 정보 가져오기.
   * @returns 사용자 정보 응답
   */
  async getCurrentUserInfo(): Promise<UserInfoApiResponse> {
    const tokenResult = await this.getToken();
    if (!tokenResult.success || !tokenResult.data) {
      return createErrorResponse('저장된 토큰이 없습니다.');
    }
    
    return await this.provider.getUserInfo(tokenResult.data);
  }

  /**
   * 현재 인증 상태 확인.
   * @returns 인증 상태 응답
   */
  async isAuthenticated(): Promise<IsAuthenticatedApiResponse> {
    try {
      const hasTokenResult = await this.tokenStore.hasToken();
      if (!hasTokenResult.success || !hasTokenResult.data) {
        return createSuccessResponse('토큰이 없습니다.', false);
      }
      
      const validationResult = await this.validateCurrentToken();
      return createSuccessResponse(
        validationResult.success ? '인증 상태 확인 완료' : '토큰이 유효하지 않습니다.',
        validationResult.success && validationResult.data
      );
    } catch (error) {
      console.error('인증 상태 확인 중 오류 발생:', error);
      return createErrorResponseFromException(error, '인증 상태 확인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 저장소 초기화.
   * @returns 초기화 결과 응답
   */
  async clear(): Promise<ClearResponse> {
    try {
      const clearResult = await this.tokenStore.clear();
      return clearResult;
    } catch (error) {
      console.error('저장소 초기화 중 오류 발생:', error);
      return createErrorResponseFromException(error, '저장소 초기화 중 오류가 발생했습니다.');
    }
  }
}

