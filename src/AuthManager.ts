// 인증 + 저장 전략들을 주입받아 로그인 흐름 제어 
import { AuthProvider, IEmailVerifiable } from './providers/interfaces';
import { TokenStore } from './storage/TokenStore.interface';
import { Token, ApiConfig } from './shared/types';
import { createAuthProvider, isAuthProviderFactoryError } from './factories/AuthProviderFactory';
import { createTokenStore, isTokenStoreFactoryError } from './factories/TokenStoreFactory';
import { HttpClient } from './network/interfaces/HttpClient';
import { ReactNativeBridge } from './storage/interfaces/ReactNativeBridge';
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
  ServiceAvailabilityApiResponse,
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
  providerType?: 'email' | 'google' | 'fake'; // 팩토리를 통한 Provider 생성 (권장)
  provider?: AuthProvider; // 직접 Provider 인스턴스 주입 (테스트에 유리하나, 프로덕션에서는 DI/팩토리 레이어 통해 주입 권장)
  apiConfig: ApiConfig;
  httpClient: HttpClient;  // HttpClient를 필수로 추가
  tokenStore?: TokenStore; // 직접 TokenStore 인스턴스 제공 (선택사항)
  tokenStoreType?: 'web' | 'mobile' | 'react-native' | 'fake'; // TokenStore 타입으로 팩토리에서 생성 (선택사항)
  providerConfig?: any; // Provider별 추가 설정 (Google의 경우 googleClientId 등)
  platform?: 'web' | 'app' | 'react-native'; // 클라이언트 플랫폼 타입 (기본값: 'web')
  
  // React Native 전용 설정
  nativeBridge?: ReactNativeBridge; // React Native 네이티브 브릿지 (React Native 플랫폼에서 필수)
  enableNativeDelegation?: boolean; // 네이티브 위임 활성화 여부 (기본값: false)
}

export class AuthManager {
  private provider: AuthProvider; // ① 어떤 방식(이메일, 구글...)으로 로그인할 건지 저장
  private tokenStore: TokenStore; // ② 어떤 방식으로 토큰을 저장할 건지 저장
  private config: AuthManagerConfig; // 설정 저장

  constructor(config: AuthManagerConfig) {
    this.config = config; // 설정 저장
    
    // Provider 설정 검증
    if (!config.provider && !config.providerType) {
      throw new Error('[AuthManager] provider 또는 providerType 중 하나는 반드시 제공되어야 합니다.');
    }

    // React Native 플랫폼별 설정 검증
    this.validateReactNativeConfig(config);

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

  private createProvider(providerType: 'email' | 'google' | 'fake', apiConfig: ApiConfig, httpClient: HttpClient): AuthProvider {
    // Provider 팩토리 로직 (apiConfig 주입)
    const config = this.config.providerConfig || { timeout: 10000, retryCount: 3 }; // providerConfig 우선, 없으면 기본 설정
    const platform = this.config.platform || 'web'; // 플랫폼 기본값: 'web'
    
    const result = createAuthProvider(providerType, config, httpClient, apiConfig, platform);
    
    // 타입 가드를 사용한 안전한 에러 처리
    if (isAuthProviderFactoryError(result)) {
      const errorMessage = `[AuthManager] Provider 생성 실패: ${result.error}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    // 여기서부터 result는 AuthProvider 타입으로 안전하게 좁혀짐
    return result;
  }

  /**
   * React Native 플랫폼별 설정 검증
   */
  private validateReactNativeConfig(config: AuthManagerConfig): void {
    const isReactNative = config.platform === 'react-native' || 
                         config.tokenStoreType === 'react-native' ||
                         config.enableNativeDelegation;

    if (isReactNative) {
      // React Native 환경에서는 nativeBridge가 필수
      if (!config.nativeBridge) {
        throw new Error('[AuthManager] React Native 플랫폼에서는 nativeBridge가 필수입니다.');
      }

      // tokenStoreType이 react-native가 아닌 경우 경고
      if (config.tokenStoreType && config.tokenStoreType !== 'react-native') {
        console.warn(`[AuthManager] React Native 플랫폼에서는 tokenStoreType을 'react-native'로 설정하는 것을 권장합니다. 현재: ${config.tokenStoreType}`);
      }
    }

    // nativeBridge가 제공되었지만 React Native 설정이 없는 경우 경고
    if (config.nativeBridge && !isReactNative) {
      console.warn('[AuthManager] nativeBridge가 제공되었지만 React Native 플랫폼 설정이 없습니다. platform을 "react-native"로 설정하는 것을 권장합니다.');
    }
  }

  private createTokenStoreFromType(tokenStoreType?: 'web' | 'mobile' | 'react-native' | 'fake'): TokenStore {
    // 지정된 타입이 있으면 해당 타입으로, 없으면 기본값 'fake' 사용
    const type = tokenStoreType || 'fake';
    
    // React Native 타입인 경우 nativeBridge 전달
    if (type === 'react-native' || type === 'mobile') {
      const result = createTokenStore(type, undefined, undefined, this.config.nativeBridge);
      
      // 타입 가드를 사용한 안전한 에러 처리
      if (isTokenStoreFactoryError(result)) {
        console.error('토큰 저장소 생성 실패:', result.error);
        throw new Error(result.message);
      }
      
      return result;
    }
    
    // 일반적인 TokenStore 생성
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
      // API 형식 검증 (필수 필드 확인)
      if (!this.isValidLoginRequest(request)) {
        return createErrorResponse('지원하지 않는 로그인 방식입니다');
      }

      // Provider 타입별 검증
      if (!this.isProviderCompatible(request)) {
        const requestedProvider = request.provider;
        const capitalizedProvider = requestedProvider.charAt(0).toUpperCase() + requestedProvider.slice(1);
        return createErrorResponse(`${capitalizedProvider} 로그인을 지원하지 않는 제공자입니다.`);
      }

      // Provider 타입별 로그인 요청 처리
      let processedRequest = request;
      
      // 소셜 로그인 요청인 경우 Provider 타입에 맞게 변환
      if ('authCode' in request && request.provider !== 'email') {
        processedRequest = this.processSocialLoginRequest(request);
      }
      
      // ④ 로그인 시도 (누가? 전달받은 provider가!)
      const loginResponse = await this.provider.login(processedRequest);
      
      if (loginResponse.success && loginResponse.data?.accessToken) {
        // ⑤ 로그인 성공 시 토큰 저장 (쿠키 기반)
        const token: Token = {
          accessToken: loginResponse.data.accessToken,
          // refreshToken은 쿠키로 관리되므로 토큰 스토어에는 빈 문자열로 설정
          refreshToken: '',
          expiredAt: loginResponse.data.expiredAt
        };
        const saveResult = await this.tokenStore.saveToken(token);
        if (saveResult.success) {
          console.log(`[AuthManager] ${this.provider.providerName} 로그인 성공, 토큰 저장됨`);
        } else {
          console.error('[AuthManager] 토큰 저장 실패');
        }
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in loginResponse ? loginResponse.error : '알 수 없는 오류';
      }
      
      return loginResponse;
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      return createErrorResponseFromException(error, '로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 로그인 요청 형식 검증
   * @param request 로그인 요청
   * @returns 요청 형식 유효 여부
   */
  private isValidLoginRequest(request: LoginRequest): boolean {
    // 이메일 로그인 요청인 경우
    if ('email' in request) {
      return typeof request.email === 'string' && 
             typeof request.verifyCode === 'string' && 
             (request.provider === 'email' || request.provider === 'fake');
    }

    // OAuth 로그인 요청인 경우
    if ('authCode' in request) {
      return typeof request.authCode === 'string' && 
             request.provider && 
             request.provider !== 'email';
    }

    return false;
  }

  /**
   * Provider 타입 호환성 검증
   * @param request 로그인 요청
   * @returns Provider 타입 호환 여부
   */
  private isProviderCompatible(request: LoginRequest): boolean {
    const currentProvider = this.provider.providerName;
    const requestedProvider = request.provider;

    // 이메일 로그인 요청인 경우
    if ('email' in request) {
      // fake provider는 이메일 로그인을 시뮬레이션할 수 있음
      return currentProvider === 'email' || currentProvider === 'fake';
    }

    // OAuth 로그인 요청인 경우
    if ('authCode' in request) {
      return currentProvider === requestedProvider;
    }

    return false;
  }

  /**
   * OAuth 로그인 요청을 Provider별 형식으로 변환
   * @param request OAuth 로그인 요청
   * @returns Provider별 형식으로 변환된 요청
   */
  private processSocialLoginRequest(request: any): any {
    const { provider, authCode, redirectUri, codeVerifier } = request;
    
    // 모든 OAuth Provider는 동일한 형식 사용
    const processedRequest = {
      provider: provider,
      authCode: authCode,
      redirectUri: redirectUri,
      codeVerifier: codeVerifier  // ✅ codeVerifier 추가
    };
    
    return processedRequest;
  }

  /**
   * 로그아웃 수행.
   * @param request 로그아웃 요청 정보
   * @returns 로그아웃 결과
   */
  async logout(request: LogoutRequest): Promise<LogoutApiResponse> {
    try {
      // 플랫폼별 로그아웃 처리
      const platform = this.config.platform || 'web';
      let logoutRequest = { ...request };
      
      // 저장된 토큰 가져오기
      const tokenResult = await this.tokenStore.getToken();
      
      if (tokenResult.success && tokenResult.data) {
        // 이메일 로그아웃인 경우에만 accessToken을 헤더로 전달
        if (this.provider.providerName === 'email' && tokenResult.data.accessToken) {
          logoutRequest.accessToken = tokenResult.data.accessToken;
        }
        
        // 모바일 앱인 경우 저장된 refreshToken을 request에 추가
        if (platform === 'app' && tokenResult.data.refreshToken) {
          logoutRequest.refreshToken = tokenResult.data.refreshToken;
        }
      }
      
      // ⑦ 로그아웃 시도 (누가? 전달받은 provider가!)
      const logoutResponse = await this.provider.logout(logoutRequest);
      
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

  // ========================================
  // React Native 전용 메서드들
  // ========================================

  /**
   * 현재 플랫폼이 React Native인지 확인
   * @returns React Native 플랫폼 여부
   */
  isReactNativePlatform(): boolean {
    return this.config.platform === 'react-native' || 
           this.config.tokenStoreType === 'react-native' ||
           !!this.config.nativeBridge;
  }

  /**
   * 네이티브 브릿지 상태 확인
   * React Native 플랫폼에서만 사용 가능
   * @returns 네이티브 브릿지 상태
   */
  async isNativeBridgeHealthy(): Promise<boolean> {
    if (!this.isReactNativePlatform()) {
      console.warn('[AuthManager] isNativeBridgeHealthy()는 React Native 플랫폼에서만 사용 가능합니다.');
      return false;
    }

    if (!this.config.nativeBridge) {
      return false;
    }

    // ReactNativeTokenStore의 isNativeBridgeHealthy 메서드 활용
    if ('isNativeBridgeHealthy' in this.tokenStore) {
      return await (this.tokenStore as any).isNativeBridgeHealthy();
    }

    return true; // 기본값
  }

  /**
   * 네이티브 OAuth 로그인 시작
   * React Native 플랫폼에서만 사용 가능
   * @param provider OAuth 제공자
   * @returns 로그인 시작 성공 여부
   */
  async startNativeOAuth(provider: 'google' | 'kakao' | 'naver' | 'apple'): Promise<SuccessResponse<boolean> | ErrorResponse> {
    try {
      if (!this.isReactNativePlatform()) {
        return createErrorResponse('startNativeOAuth()는 React Native 플랫폼에서만 사용 가능합니다.');
      }

      if (!this.config.nativeBridge) {
        return createErrorResponse('네이티브 브릿지가 설정되지 않았습니다.');
      }

      // ReactNativeTokenStore의 startOAuth 메서드 활용
      if ('startOAuth' in this.tokenStore) {
        const result = await (this.tokenStore as any).startOAuth(provider);
        return createSuccessResponse('네이티브 OAuth 로그인이 시작되었습니다.', result);
      }

      return createErrorResponse('ReactNativeTokenStore가 아닙니다.');
    } catch (error) {
      console.error('네이티브 OAuth 로그인 시작 중 오류 발생:', error);
      return createErrorResponseFromException(error, '네이티브 OAuth 로그인 시작에 실패했습니다.');
    }
  }

  /**
   * 현재 세션 정보 가져오기
   * React Native 플랫폼에서만 사용 가능
   * @returns 현재 세션 정보
   */
  async getCurrentSession(): Promise<any> {
    if (!this.isReactNativePlatform()) {
      throw new Error('getCurrentSession()는 React Native 플랫폼에서만 사용 가능합니다.');
    }

    if (!this.config.nativeBridge) {
      throw new Error('네이티브 브릿지가 설정되지 않았습니다.');
    }

    // ReactNativeTokenStore의 getSessionInfo 메서드 활용
    if ('getSessionInfo' in this.tokenStore) {
      return await (this.tokenStore as any).getSessionInfo();
    }

    throw new Error('ReactNativeTokenStore가 아닙니다.');
  }

  /**
   * 보호된 API 대리호출
   * React Native 플랫폼에서만 사용 가능 (M2A 패턴)
   * @param request API 요청 정보
   * @returns API 응답
   */
  async callProtectedAPI(request: { url: string; method: string; headers?: Record<string, string>; body?: string }): Promise<any> {
    if (!this.isReactNativePlatform()) {
      throw new Error('callProtectedAPI()는 React Native 플랫폼에서만 사용 가능합니다.');
    }

    if (!this.config.nativeBridge) {
      throw new Error('네이티브 브릿지가 설정되지 않았습니다.');
    }

    // ReactNativeTokenStore의 callWithAuth 메서드 활용
    if ('callWithAuth' in this.tokenStore) {
      return await (this.tokenStore as any).callWithAuth(request);
    }

    throw new Error('ReactNativeTokenStore가 아닙니다.');
  }

  /**
   * 네이티브 브릿지 직접 접근 (고급 사용)
   * React Native 플랫폼에서만 사용 가능
   * @returns 네이티브 브릿지 인스턴스
   */
  getNativeBridge(): ReactNativeBridge | null {
    if (!this.isReactNativePlatform()) {
      console.warn('[AuthManager] getNativeBridge()는 React Native 플랫폼에서만 사용 가능합니다.');
      return null;
    }

    return this.config.nativeBridge || null;
  }


}