import { 
  AuthManager, 
  EmailVerificationApiResponse, 
  LoginApiResponse, 
  RefreshTokenApiResponse, 
  LogoutApiResponse 
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
    this.authManager = new AuthManager({
      providerType: 'email',
      tokenStore: this.tokenStore,
        apiConfig: { /* API 설정 */
          apiBaseUrl: currentConfig.apiBaseUrl,
          endpoints: {
           requestVerification: '/api/auth/email/request-verification',
            login: '/api/auth/email/login',
            logout: '/api/auth/email/logout',
            refresh: '/api/auth/email/refresh',
            validate: '/api/auth/validate-token',
            me: '/api/auth/user-info',
            health: '/api/health'
          }
      },
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
    
    // MSW 워커 시작
    setupMSWWorker().catch((error) => {
      console.error('MSW 워커 설정 실패:', error);
    });
    
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
        this.updateStatus(`인증번호 요청 실패: ${result.error}`, 'error');
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
      const verificationCode = (document.getElementById('verificationCode') as HTMLInputElement).value;
      
      if (!email || !verificationCode) {
        this.updateStatus('이메일과 인증번호를 모두 입력해주세요.', 'error');
        return;
      }

      // 이메일 인증은 provider를 통해 직접 호출해야 함
      this.updateStatus('이메일 인증 기능은 provider를 통해 구현됩니다.', 'info');
    } catch (error) {
      this.updateStatus(`이메일 인증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  private async loginWithEmail(): Promise<LoginApiResponse> {
    try {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      if (!email || !password) {
        const errorResponse: LoginApiResponse = {
          success: false,
          message: '이메일과 비밀번호를 모두 입력해주세요.',
          data: null,
          error: '이메일과 비밀번호를 모두 입력해주세요.'
        };
        this.updateStatus('이메일과 비밀번호를 모두 입력해주세요.', 'error');
        return errorResponse;
      }

      const result = await this.authManager.login({ 
        provider: 'email', 
        email, 
        verificationCode: '123456' 
      });
      
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

      // 구글 로그인은 별도 provider가 필요하므로 모의 구현
      this.updateStatus('구글 로그인 기능은 별도 provider 구현이 필요합니다.', 'info');
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
