// 인증 + 저장 전략들을 주입받아 로그인 흐름 제어 
import { AuthProvider, LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, RefreshTokenRequest, RefreshTokenResponse, EmailVerificationRequest, EmailVerificationResponse } from './providers';
import { TokenStore } from './storage/TokenStore.interface';
import { Token, UserInfo } from './types';

export class AuthManager {
  private provider: AuthProvider; // ① 어떤 방식(이메일, 구글...)으로 로그인할 건지 저장
  private tokenStore: TokenStore; // ② 어떤 방식으로 토큰을 저장할 건지 저장

  constructor(provider: AuthProvider, tokenStore: TokenStore) {
    this.provider = provider; // ③ 생성자에서 로그인 전략(Provider)을 받아 저장해둠
    this.tokenStore = tokenStore; // ④ 생성자에서 저장 전략(TokenStore)을 받아 저장해둠
  }

  /**
   * 이메일 인증번호 요청.
   * @param request 이메일 인증번호 요청 정보
   * @returns 인증번호 요청 결과
   */
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    try {
      const verificationResponse = await this.provider.requestEmailVerification(request);
      
      if (verificationResponse.success) {
        console.log('인증번호 요청 성공:', request.email);
      } else {
        console.log('인증번호 요청 실패:', verificationResponse.error);
      }
      
      return verificationResponse;
    } catch (error) {
      console.error('인증번호 요청 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 로그인 수행.
   * @param request 로그인 요청 정보
   * @returns 로그인 결과
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // ⑤ 로그인 시도 (누가? 전달받은 provider가!)
      const loginResponse = await this.provider.login(request);
      
      if (loginResponse.success && loginResponse.token) {
        // ⑥ 로그인 성공 시 토큰을 저장 전략을 통해 저장
        await this.tokenStore.saveToken(loginResponse.token);
        console.log('로그인 성공, 토큰 저장됨:', loginResponse.token);
      } else {
        console.log('로그인 실패:', loginResponse.error);
      }
      
      return loginResponse;
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 로그아웃 수행.
   * @param request 로그아웃 요청 정보
   * @returns 로그아웃 결과
   */
  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    try {
      // ⑦ 로그아웃 시도 (누가? 전달받은 provider가!)
      const logoutResponse = await this.provider.logout(request);
      
      if (logoutResponse.success) {
        // ⑧ 로그아웃 성공 시 저장된 토큰 삭제
        await this.tokenStore.removeToken();
        console.log('로그아웃 성공, 토큰 삭제됨');
      } else {
        console.log('로그아웃 실패:', logoutResponse.error);
      }
      
      return logoutResponse;
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
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
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const refreshResponse = await this.provider.refreshToken(request);
      
      if (refreshResponse.success && refreshResponse.token) {
        // 토큰 갱신 성공 시 새로운 토큰 저장
        await this.tokenStore.saveToken(refreshResponse.token);
        console.log('토큰 갱신 성공, 새 토큰 저장됨');
      }
      
      return refreshResponse;
    } catch (error) {
      console.error('토큰 갱신 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
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

