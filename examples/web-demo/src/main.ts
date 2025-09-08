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
  private messageHandler: ((event: MessageEvent) => void) | null = null;

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
        googleRefresh: '/api/v1/auth/google/refresh',
        googleValidate: '/api/v1/auth/google/validate',
        googleUserinfo: '/api/v1/auth/google/userinfo'
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
    
    // OAuth 콜백 처리 설정
    this.setupOAuthCallbackHandling();
    
    this.initializeEventListeners();
    this.updateStatus('AuthCore 웹 데모가 준비되었습니다. 🚀', 'info');
  }

  private initializeEventListeners(): void {
    // 이메일 인증 관련
    document.getElementById('requestVerification')?.addEventListener('click', () => this.requestVerification());
    document.getElementById('verifyEmail')?.addEventListener('click', () => this.verifyEmail());
    document.getElementById('loginWithEmail')?.addEventListener('click', () => this.loginWithEmail());

    // 구글 인증 관련
    document.getElementById('loginWithGoogle')?.addEventListener('click', () => this.loginWithGoogleOAuth());
    document.getElementById('loginWithGoogleMock')?.addEventListener('click', () => this.loginWithGoogleMock());

    // 토큰 관리 관련
    document.getElementById('refreshToken')?.addEventListener('click', () => this.refreshToken());
    document.getElementById('logout')?.addEventListener('click', () => this.logout());
    document.getElementById('getTokenInfo')?.addEventListener('click', () => this.getTokenInfo());
  }

  // OAuth 콜백 처리 설정
  private setupOAuthCallbackHandling(): void {
    // URL 파라미터에서 OAuth 콜백 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth_success') === 'true') {
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        console.log('OAuth 콜백 감지됨');
        this.handleGoogleOAuthCallback(code, state);
        
        // URL에서 OAuth 파라미터 제거
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('oauth_success');
        newUrl.searchParams.delete('code');
        newUrl.searchParams.delete('state');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }

    // 팝업 창에서 OAuth 콜백 메시지 수신 (보안 검증 포함)
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  }

  // 메시지 핸들러 (클래스 내부로 일원화)
  private handleMessage = (event: MessageEvent): void => {
    // P1: origin 검증 - 보안을 위해 필수
    const allowedOrigin = window.location.origin;
    if (event.origin !== allowedOrigin) {
      console.warn('OAuth 메시지: 허용되지 않은 origin에서 메시지 수신', event.origin);
      return;
    }

    // 메시지 데이터 구조 검증
    if (!event.data || typeof event.data !== 'object') {
      console.warn('OAuth 메시지: 유효하지 않은 메시지 데이터');
      return;
    }

    // 메시지 타입 검증
    if (!event.data.type || typeof event.data.type !== 'string') {
      console.warn('OAuth 메시지: 유효하지 않은 메시지 타입');
      return;
    }

    try {
      if (event.data.type === 'OAUTH_SUCCESS') {
        // OAUTH_SUCCESS 메시지 스키마 검증
        if (typeof event.data.code !== 'string' || typeof event.data.state !== 'string') {
          console.warn('OAuth 메시지: OAUTH_SUCCESS 메시지 스키마가 올바르지 않음');
          return;
        }
        console.log('OAuth 성공 메시지 수신');
        this.handleGoogleOAuthCallback(event.data.code, event.data.state);
      } else if (event.data.type === 'OAUTH_ERROR') {
        // OAUTH_ERROR 메시지 스키마 검증
        if (typeof event.data.error !== 'string') {
          console.warn('OAuth 메시지: OAUTH_ERROR 메시지 스키마가 올바르지 않음');
          return;
        }
        console.error('OAuth 에러 메시지 수신');
        this.updateStatus(`OAuth 에러: ${event.data.error}`, 'error');
      } else {
        console.warn('OAuth 메시지: 알 수 없는 메시지 타입', event.data.type);
      }
    } catch (error) {
      console.error('OAuth 메시지 처리 중 오류:', error);
      this.updateStatus('OAuth 메시지 처리 중 오류가 발생했습니다.', 'error');
    }
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

  private async loginWithGoogleOAuth(): Promise<void> {
    try {
      const googleClientId = (document.getElementById('googleClientId') as HTMLInputElement).value;
      
      if (!googleClientId) {
        this.updateStatus('Google Client ID를 입력해주세요.', 'error');
        return;
      }

      // Google OAuth 2.0 URL 생성 (PKCE 적용)
      const redirectUri = window.location.origin + '/auth/google/callback';
      const scope = 'openid email profile';
      
      // 강한 랜덤 state 생성 (32바이트)
      const state = this.generateSecureRandom(32);
      
      // PKCE 파라미터 생성
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // 🔐 PKCE 정보 로깅 (보안을 위해 일부만 표시)
      const codeVerifierPreview = codeVerifier.substring(0, 10) + '...' + codeVerifier.substring(codeVerifier.length - 10);
      const codeChallengePreview = codeChallenge.substring(0, 10) + '...' + codeChallenge.substring(codeChallenge.length - 10);
      console.log('🔐 PKCE 생성 완료:');
      console.log('  - code_verifier:', codeVerifierPreview);
      console.log('  - code_challenge:', codeChallengePreview);
      this.updateStatus(`🔐 PKCE 보안 파라미터 생성 완료`, 'info');
      
      // state와 code_verifier를 localStorage에 저장 (보안을 위해)
      localStorage.setItem('google_oauth_state', state);
      localStorage.setItem('google_oauth_code_verifier', codeVerifier);
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${encodeURIComponent(state)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      this.updateStatus('Google OAuth 페이지로 이동합니다...', 'info');
      
      // 팝업 창으로 OAuth 열기
      console.log('🌐 구글 OAuth URL:', googleAuthUrl);
      const popup = window.open(googleAuthUrl, 'google_oauth', 'width=500,height=600');
      
      if (!popup) {
        this.updateStatus('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'error');
        return;
      }
      
    } catch (error) {
      this.updateStatus(`Google OAuth 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  // Google OAuth 콜백 처리
  private async handleGoogleOAuthCallback(code: string, state: string): Promise<void> {
    try {
      // 입력 파라미터 검증
      if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
        this.updateStatus('OAuth 콜백 파라미터가 올바르지 않습니다.', 'error');
        return;
      }

      console.log('Google OAuth 콜백 처리 시작');
      
      // 🔍 구글 인증 서버에서 받은 authCode 확인 (보안을 위해 일부만 표시)
      const authCodePreview = code.substring(0, 10) + '...' + code.substring(code.length - 10);
      console.log('✅ 구글 인증 서버에서 받은 authCode:', authCodePreview);
      this.updateStatus(`✅ 구글 인증 서버에서 authCode를 받았습니다: ${authCodePreview}`, 'info');
      
      // 저장된 state와 비교 (보안 검증)
      const savedState = localStorage.getItem('google_oauth_state');
      if (!savedState || state !== savedState) {
        this.updateStatus('OAuth state 불일치. 보안상 로그인을 취소합니다.', 'error');
        return;
      }
      
      // state 사용 후 제거
      localStorage.removeItem('google_oauth_state');
      
      this.updateStatus('Google OAuth 인증 코드를 받았습니다. 로그인을 진행합니다...', 'info');
      
      // Google Provider로 AuthManager 재생성
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
          googleRefresh: '/api/v1/auth/google/refresh',
          googleValidate: '/api/v1/auth/google/validate',
          googleUserinfo: '/api/v1/auth/google/userinfo'
        },
        timeout: 10000
      };

      const googleConfig = {
        googleClientId: 'test-google-client-id',
        timeout: 10000,
        retryCount: 3
      };

      const googleAuthManager = new AuthManager({
        providerType: 'google',
        apiConfig,
        httpClient: new RealHttpClient(), // MSW 대신 실제 HTTP 클라이언트 사용
        providerConfig: googleConfig
      });

      // 받은 authCode로 로그인 시도
      console.log('🚀 백엔드로 authCode 전송 시작:', authCodePreview);
      console.log('📤 전송할 데이터:', {
        authCode: authCodePreview,
        codeVerifier: localStorage.getItem('google_oauth_code_verifier')?.substring(0, 10) + '...'
      });
      
      const result = await googleAuthManager.login({ 
        provider: 'google',
        authCode: code  // ← 실제 받은 authCode 사용!
      });
      
      if (result.success && result.data) {
        this.updateStatus('Google OAuth 로그인이 성공했습니다!', 'success');
        this.displayTokenInfo(result.data);
      } else {
        this.updateStatus(`Google OAuth 로그인 실패: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.updateStatus(`Google OAuth 콜백 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  }

  private async loginWithGoogleMock(): Promise<void> {
    try {
      const googleClientId = (document.getElementById('googleClientId') as HTMLInputElement).value;
      
      if (!googleClientId) {
        this.updateStatus('Google Client ID를 입력해주세요.', 'error');
        return;
      }

      // Mock Google OAuth - 실제 Google API 호출 없이 테스트
      this.updateStatus('Mock Google OAuth 로그인을 시작합니다...', 'info');
      
      // Google Provider로 AuthManager 재생성
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
          googleRefresh: '/api/v1/auth/google/refresh',
          googleValidate: '/api/v1/auth/google/validate',
          googleUserinfo: '/api/v1/auth/google/userinfo'
        },
        timeout: 10000
      };

      // Google Provider 설정
      const googleConfig = {
        googleClientId: googleClientId,
        timeout: 10000,
        retryCount: 3
      };

      // Google Provider로 AuthManager 재생성
      const googleAuthManager = new AuthManager({
        providerType: 'google',
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
        })(),
        providerConfig: googleConfig
      });

      // Mock authCode로 로그인 시도
      const result = await googleAuthManager.login({ 
        provider: 'google',
        authCode: 'valid-google-code'  // MSW에서 성공으로 처리하는 코드
      });
      
      // UI 업데이트
      if (result.success && result.data) {
        this.updateStatus('Mock Google 로그인이 성공했습니다!', 'success');
        this.displayTokenInfo(result.data);
        
        // 토큰은 AuthManager가 자동으로 저장함
      } else {
        this.updateStatus(`Mock Google 로그인 실패: ${result.error}`, 'error');
      }
    } catch (error) {
      this.updateStatus(`Mock Google 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
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
        provider: 'email'
        // refreshToken은 쿠키로 전송되므로 필드 없음
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

  /**
   * 강한 랜덤 문자열 생성 (crypto.getRandomValues 사용)
   * @param length 생성할 바이트 길이
   * @returns URL-safe base64 인코딩된 랜덤 문자열
   */
  private generateSecureRandom(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[\+\/=]/g, '');
  }

  /**
   * PKCE code_verifier 생성
   * @returns 64바이트 랜덤 code_verifier
   */
  private generateCodeVerifier(): string {
    return this.generateSecureRandom(64);
  }

  /**
   * PKCE code_challenge 생성 (SHA-256 + base64url)
   * @param codeVerifier code_verifier
   * @returns code_challenge
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/[\+\/=]/g, '');
  }

  // 컴포넌트 정리 (메모리 누수 방지)
  public destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
  }
}

// 페이지 로드 시 데모 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 데모 초기화
  new AuthDemo();
});