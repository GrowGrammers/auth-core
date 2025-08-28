import { 
  AuthManager, 
  EmailVerificationApiResponse, 
  LoginApiResponse, 
  RefreshTokenApiResponse, 
  LogoutApiResponse,
  ApiConfig
} from 'auth-core';
import { createTokenStore, isTokenStoreFactorySuccess, TokenStore, TokenStoreType } from 'auth-core';
import { WebTokenStore } from './WebTokenStore';
import { RealHttpClient, MSWHttpClient, MockHttpClient } from './http-clients';
import { setupMSWWorker } from './utils/msw-worker-setup';
import { currentConfig } from './config';

class AuthDemo {
  private authManager: AuthManager;
  private tokenStore: TokenStore;

  constructor() {
    const tokenStoreResult = createTokenStore('auto' as TokenStoreType);
    if (isTokenStoreFactorySuccess(tokenStoreResult)) {
      this.tokenStore = tokenStoreResult;
    } else {
      // 실패 시 기본 WebTokenStore 사용
      this.tokenStore = new WebTokenStore();
    }
    
    // API 설정
    const apiConfig: ApiConfig = {
      apiBaseUrl: currentConfig.apiBaseUrl,
      endpoints: {
        requestVerification: '/api/v1/auth/email/request',
        verifyEmail: '/api/v1/auth/email/verify',
        login: '/api/v1/auth/members/email-login',
        logout: '/api/v1/auth/members/logout',
        refresh: '/api/v1/auth/members/refresh',
        validate: '/api/v1/auth/validate-token',
        me: '/api/v1/auth/user-info',
        health: '/api/v1/health',
        googleLogin: '/api/v1/auth/google/login',
        googleLogout: '/api/v1/auth/google/logout',
        googleRefresh: '/api/v1/auth/google/refresh'
      },
      timeout: 10000
    };
    
    this.authManager = new AuthManager({
      providerType: 'email',
      tokenStore: this.tokenStore,
      apiConfig,
      httpClient: (() => {
        switch (currentConfig.httpClient) {
          case 'MSWHttpClient':
            return new MSWHttpClient();
          case 'MockHttpClient':
            return new MockHttpClient();
          case 'RealHttpClient':
            return new RealHttpClient();
          default:
            return new MSWHttpClient();
        }
      })()
    });
    
    // MSW 워커 시작 (RealHttpClient 사용 시에는 시작하지 않음)
    if (currentConfig.httpClient !== 'RealHttpClient') {
      setupMSWWorker().catch((error) => {
        console.error('MSW 워커 설정 실패:', error);
      });
    } else {
      console.log('🚀 RealHttpClient 사용 - MSW 워커를 시작하지 않습니다.');
      console.log(`📡 로컬 백엔드 서버: ${currentConfig.apiBaseUrl}`);
    }
    
    this.initializeEventListeners();
    this.updateStatus('AuthCore 웹 데모가 준비되었습니다. 🚀', 'info');
  }

  private initializeEventListeners(): void {
    // 이메일 인증 관련
    document.getElementById('requestVerification')?.addEventListener('click', () => this.requestVerification());
    document.getElementById('verifyEmail')?.addEventListener('click', () => this.verifyEmail());
    document.getElementById('loginWithEmail')?.addEventListener('click', () => this.loginWithEmail());

    // 구글 인증 관련
    document.getElementById('loginWithGoogle')?.addEventListener('click', () => this.loginWithGoogle());

    // 토큰 관리 관련
    document.getElementById('refreshToken')?.addEventListener('click', () => this.refreshToken());
    document.getElementById('logout')?.addEventListener('click', () => this.logout());
    document.getElementById('getTokenInfo')?.addEventListener('click', () => this.getTokenInfo());
  }

  private async requestVerification(): Promise<EmailVerificationApiResponse> {
    console.log('인증번호 요청 시작...');
    try {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      if (!email) {
        const errorResponse: EmailVerificationApiResponse = {
          success: false,
          message: '이메일을 입력해주세요.',
          data: null,
          error: '이메일을 입력해주세요.'
        };
        this.updateStatus('이메일을 입력해주세요.', 'error');
        return errorResponse;
      }
      const result = await this.authManager.requestEmailVerification({ email });
      
      console.log('인증번호 요청 결과:', result);
      
      // UI 업데이트
      if (result.success) {
        this.updateStatus('인증번호가 이메일로 전송되었습니다.', 'success');
      } else {
        const errorMsg = result.error || result.message || '알 수 없는 오류';
        console.error('❌ 인증번호 요청 실패 상세:', {
          success: result.success,
          message: result.message,
          error: result.error,
          data: result.data
        });
        this.updateStatus(`인증번호 요청 실패: ${errorMsg}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorResponse: EmailVerificationApiResponse = {
        success: false,
        message: `인증번호 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        data: null,
        error: `인증번호 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
      this.updateStatus(`인증번호 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      return errorResponse;
    }
  }

  private async verifyEmail(): Promise<void> {
    try {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const verifyCode = (document.getElementById('verificationCode') as HTMLInputElement).value;
      
      if (!email || !verifyCode) {
        this.updateStatus('이메일과 인증번호를 모두 입력해주세요.', 'error');
        return;
      }

      // AuthManager를 통해 이메일 인증 API 호출
      const result = await this.authManager.verifyEmail({ 
        email, 
        verifyCode: verifyCode 
      });
      console.log('인증번호 인증 결과:', result);
      // UI 업데이트
      if (result.success) {
        this.updateStatus('이메일 인증이 완료되었습니다!', 'success');
      } else {
        this.updateStatus(`이메일 인증 실패: ${result.error}`, 'error');
      }
    } catch (error) {
      this.updateStatus(`이메일 인증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  private async loginWithEmail(): Promise<LoginApiResponse> {
    try {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const verifyCode = (document.getElementById('verificationCode') as HTMLInputElement).value;
      
      if (!email) {
        const errorResponse: LoginApiResponse = {
          success: false,
          message: '이메일을 입력해주세요.',
          data: null,
          error: '이메일을 입력해주세요.'
        };
        this.updateStatus('이메일을 입력해주세요.', 'error');
        return errorResponse;
      }

      if (!verifyCode) {
        const errorResponse: LoginApiResponse = {
          success: false,
          message: '인증번호를 입력해주세요.',
          data: null,
          error: '인증번호를 입력해주세요.'
        };
        this.updateStatus('인증번호를 입력해주세요.', 'error');
        return errorResponse;
      }

      const result = await this.authManager.login({ 
        provider: 'email', 
        email,
        verifyCode
      });

      console.log('이메일 로그인 결과:', result);

      // UI 업데이트
      if (result.success && result.data) {
        this.updateStatus('이메일 로그인이 성공했습니다!', 'success');
        this.displayTokenInfo(result.data);
      } else {
        this.updateStatus(`이메일 로그인 실패: ${result.error}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorResponse: LoginApiResponse = {
        success: false,
        message: `이메일 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        data: null,
        error: `이메일 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
      this.updateStatus(`이메일 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      return errorResponse;
    }
  }

  private async loginWithGoogle(): Promise<void> {
    try {
      const googleToken = (document.getElementById('googleToken') as HTMLInputElement).value;
      
      if (!googleToken) {
        this.updateStatus('구글 토큰을 입력해주세요.', 'error');
        return;
      }

      // AuthManager를 통해 구글 로그인 API 호출
      const result = await this.authManager.login({ 
        provider: 'google',
        googleToken 
      });
      
      // UI 업데이트
      if (result.success && result.data) {
        this.updateStatus('구글 로그인이 성공했습니다!', 'success');
        this.displayTokenInfo(result.data);
      } else {
        this.updateStatus(`구글 로그인 실패: ${result.error}`, 'error');
      }
    } catch (error) {
      this.updateStatus(`구글 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  private async refreshToken(): Promise<RefreshTokenApiResponse> {
    try {
      const tokenResult = await this.tokenStore.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        const errorResponse: RefreshTokenApiResponse = {
          success: false,
          message: '저장된 토큰이 없습니다.',
          data: null,
          error: '저장된 토큰이 없습니다.'
        };
        this.updateStatus('저장된 토큰이 없습니다.', 'error');
        return errorResponse;
      }

      const result = await this.authManager.refreshToken({ 
        provider: 'email', 
        refreshToken: tokenResult.data.refreshToken || ''
      });

      console.log('토큰 갱신 결과:', result);
      
      // UI 업데이트
      if (result.success && result.data) {
        this.updateStatus('토큰이 성공적으로 갱신되었습니다!', 'success');
        this.displayTokenInfo(result.data);
        
        // 토큰 갱신 후 저장 상태 확인
        const hasTokenResult = await this.tokenStore.hasToken();
        console.log('토큰 갱신 후 저장 상태:', hasTokenResult);
        
        if (hasTokenResult.success && hasTokenResult.data) {
          const tokenResult = await this.tokenStore.getToken();
          console.log('갱신된 토큰 정보:', tokenResult);
        }
      } else {
        this.updateStatus(`토큰 갱신 실패: ${result.error}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorResponse: RefreshTokenApiResponse = {
        success: false,
        message: `토큰 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        data: null,
        error: `토큰 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
      this.updateStatus(`토큰 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      return errorResponse;
    }
  }

  private async logout(): Promise<LogoutApiResponse> {
    console.log('로그아웃 시작...');
    
    // 로그아웃 전 토큰 상태 확인
    const hasTokenResult = await this.tokenStore.hasToken();
    console.log('토큰 존재 여부:', hasTokenResult);
    
    if (hasTokenResult.success && hasTokenResult.data) {
      const tokenResult = await this.tokenStore.getToken();
      console.log('현재 저장된 토큰:', tokenResult);
    }
    
    try {
      const result = await this.authManager.logout({ provider: 'email' });
      
      console.log('로그아웃 결과:', result);
      
      // UI 업데이트
      if (result.success) {
        this.updateStatus('로그아웃이 완료되었습니다.', 'info');
        this.hideTokenInfo();
      } else {
        this.updateStatus(`로그아웃 실패: ${result.error}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorResponse: LogoutApiResponse = {
        success: false,
        message: `로그아웃 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        data: null,
        error: `로그아웃 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
      this.updateStatus(`로그아웃 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
      return errorResponse;
    }
  }

  private async getTokenInfo(): Promise<void> {
    try {
      const hasTokenResult = await this.tokenStore.hasToken();
      if (!hasTokenResult.success || !hasTokenResult.data) {
        this.updateStatus('저장된 토큰이 없습니다.', 'info');
        this.hideTokenInfo();
        return;
      }

      const tokenResult = await this.tokenStore.getToken();
      if (tokenResult.success && tokenResult.data) {
        this.updateStatus('토큰 정보를 조회했습니다.', 'success');
        this.displayTokenInfo(tokenResult.data);
      }
    } catch (error) {
      this.updateStatus(`토큰 정보 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  private updateStatus(message: string, type: 'success' | 'error' | 'info'): void {
    // 콘솔 로그 추가
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status ${type}`;
      statusElement.style.display = 'block';
      
      // // 5초 후 자동으로 숨기기
      // setTimeout(() => {
      //   statusElement.style.display = 'none';
      // }, 5000);
    }
  }

  private displayTokenInfo(token: any): void {
    const tokenInfoElement = document.getElementById('tokenInfo');
    if (tokenInfoElement) {
      tokenInfoElement.innerHTML = `
        <strong>토큰 정보:</strong><br>
        <strong>Access Token:</strong> ${token.accessToken}<br>
        <strong>Refresh Token:</strong> ${token.refreshToken}
      `;
      tokenInfoElement.style.display = 'block';
    }
  }

  private hideTokenInfo(): void {
    const tokenInfoElement = document.getElementById('tokenInfo');
    if (tokenInfoElement) {
      tokenInfoElement.style.display = 'none';
    }
  }
}

// 페이지 로드 시 데모 초기화
document.addEventListener('DOMContentLoaded', () => {
  new AuthDemo();
});
