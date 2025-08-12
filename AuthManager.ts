// 인증 + 저장 전략들을 주입받아 로그인 흐름 제어 
import { AuthProvider, IEmailVerifiable, ILoginProvider } from './providers/interfaces';
import { TokenStore } from './storage/TokenStore.interface';
import { Token, UserInfo, ApiConfig, ErrorResponse } from './shared/types';
import { createAuthProvider } from './factories/AuthProviderFactory';
import { FakeTokenStore } from './storage/FakeTokenStore';
import { HttpClient } from './network/interfaces/HttpClient';
import { 
  EmailVerificationRequest,
  EmailVerificationResponse,
  EmailVerificationApiResponse, 
  LoginRequest,
  LoginApiResponse, 
  LogoutRequest,
  LogoutApiResponse, 
  RefreshTokenRequest,
  RefreshTokenApiResponse 
} from './providers/interfaces/dtos/auth.dto';
import { createErrorResponse, createErrorResponseFromException } from './shared/utils/errorUtils';

export interface AuthManagerConfig {
  providerType: 'email' | 'google';
  apiConfig: ApiConfig;
  httpClient: HttpClient;  // HttpClient를 필수로 추가
  tokenStore?: TokenStore;
}

export class AuthManager {
  private provider: AuthProvider; // ① 어떤 방식(이메일, 구글...)으로 로그인할 건지 저장
  private tokenStore: TokenStore; // ② 어떤 방식으로 토큰을 저장할 건지 저장

  constructor(config: AuthManagerConfig) {
    // Provider 생성 (apiConfig 주입)
    this.provider = this.createProvider(config.providerType, config.apiConfig, config.httpClient);
    // TokenStore 생성 (기본값 또는 주입받은 값 사용)
    this.tokenStore = config.tokenStore || this.createDefaultTokenStore();
  }

  private createProvider(providerType: 'email' | 'google', apiConfig: ApiConfig, httpClient: HttpClient): AuthProvider {
    // Provider 팩토리 로직 (apiConfig 주입)
    const config = { timeout: 10000, retryCount: 3 }; // 기본 설정
    
    return createAuthProvider(providerType, config, httpClient, apiConfig);
  }

  private createDefaultTokenStore(): TokenStore {
    // 기본 TokenStore 생성 (FakeTokenStore 사용)
    return FakeTokenStore;
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
        console.log('인증번호 요청 성공');
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in verificationResponse ? verificationResponse.error : '알 수 없는 오류';
        console.log('인증번호 요청 실패:', errorMessage);
      }
      
      return verificationResponse;
    } catch (error) {
      console.error('인증번호 요청 중 오류 발생:', error);
      return createErrorResponseFromException(error, '인증번호 요청 중 오류가 발생했습니다.');
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
      
      if (loginResponse.success && loginResponse.data?.token) {
        // ⑤ 로그인 성공 시 토큰 저장
        await this.tokenStore.saveToken(loginResponse.data.token);
        console.log('로그인 성공, 토큰 저장됨:');
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in loginResponse ? loginResponse.error : '알 수 없는 오류';
        console.log('로그인 실패:', errorMessage);
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
      // ⑦ 로그아웃 시도 (누가? 전달받은 provider가!)
      const logoutResponse = await this.provider.logout(request);
      
      if (logoutResponse.success) {
        // ⑧ 로그아웃 성공 시 저장된 토큰 삭제
        await this.tokenStore.removeToken();
        console.log('로그아웃 성공, 토큰 삭제됨');
      } else {
        // 타입 가드를 통해 error 속성에 안전하게 접근
        const errorMessage = 'error' in logoutResponse ? logoutResponse.error : '알 수 없는 오류';
        console.log('로그아웃 실패:', errorMessage);
      }
      
      return logoutResponse;
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      return createErrorResponseFromException(error, '로그아웃 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 저장된 토큰 가져오기.
   * @returns 저장된 토큰 또는 null
   */
  async getToken(): Promise<Token | null> {
    return await this.tokenStore.getToken();
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
        await this.tokenStore.saveToken(refreshResponse.data);
        console.log('토큰 갱신 성공, 새 토큰 저장됨');
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
  async validateCurrentToken(): Promise<boolean> {
    const token = await this.tokenStore.getToken();
    if (!token) {
      return false;
    }
    
    // 토큰이 만료되었는지 먼저 확인
    if (await this.tokenStore.isTokenExpired()) {
      return false;
    }
    
    // Provider를 통해 토큰 유효성 검증
    return await this.provider.validateToken(token);
  }

  /**
   * 사용자 정보 가져오기.
   * @returns 사용자 정보 또는 null
   */
  async getCurrentUserInfo(): Promise<UserInfo | null> {
    const token = await this.tokenStore.getToken();
    if (!token) {
      return null;
    }
    
    return await this.provider.getUserInfo(token);
  }

  /**
   * 현재 인증 상태 확인.
   * @returns 인증 상태
   */
  async isAuthenticated(): Promise<boolean> {
    const hasToken = await this.tokenStore.hasToken();
    if (!hasToken) {
      return false;
    }
    
    return await this.validateCurrentToken();
  }

  /**
   * 저장소 초기화.
   * @returns 초기화 성공 여부
   */
  async clear(): Promise<boolean> {
    return await this.tokenStore.clear();
  }
}

