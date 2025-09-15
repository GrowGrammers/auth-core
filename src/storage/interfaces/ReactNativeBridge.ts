// React Native와 Native 모듈 간 실제 합의된 인터페이스
// 안드로이드 개발자와 협의한 최소한의 인터페이스 구현

/**
 * 인증 상태 타입
 */
export type AuthStatus = 
  | "started" 
  | "callback_received" 
  | "success" 
  | "error" 
  | "token_refreshed" 
  | "signed_out";

/**
 * OAuth 제공자 타입
 */
export type OAuthProvider = "google" | "kakao";

/**
 * 세션 정보 (네이티브에서 관리하는 최소한의 정보)
 */
export interface SessionInfo {
  isLoggedIn: boolean;
  userProfile?: {
    sub: string; // 사용자 식별자
    email?: string;
    name?: string;
    provider: OAuthProvider;
  };
}

/**
 * 보호된 API 요청 설정
 */
export interface AuthenticatedRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * 보호된 API 응답
 */
export interface AuthenticatedResponse {
  success: boolean;
  status: number;
  headers: Record<string, string>;
  data?: any;
  error?: string;
}

/**
 * 실제 합의된 React Native Bridge 인터페이스
 * 안드로이드 개발자와 협의한 최소한의 메서드들
 */
export interface ReactNativeBridge {
  // === 핵심 4개 메서드 (최소 인터페이스) ===
  
  /**
   * OAuth 로그인 시작 (Custom Tabs + 딥링크 + PKCE 전체 플로우)
   * @param provider OAuth 제공자 ('google' | 'kakao')
   * @returns Promise<boolean> 로그인 시작 성공 여부
   */
  startOAuth(provider: OAuthProvider): Promise<boolean>;

  /**
   * 현재 세션 상태 확인 (로그인 여부 + 사용자 프로필)
   * @returns Promise<SessionInfo> 세션 정보
   */
  getSession(): Promise<SessionInfo>;

  /**
   * 로그아웃 (모든 토큰 폐기)
   * @returns Promise<boolean> 로그아웃 성공 여부
   */
  signOut(): Promise<boolean>;

  /**
   * 보호된 API 대리호출 (네이티브가 Authorization 헤더 주입 후 호출)
   * @param request HTTP 요청 설정
   * @returns Promise<AuthenticatedResponse> HTTP 응답
   */
  callWithAuth(request: AuthenticatedRequest): Promise<AuthenticatedResponse>;

  // === 선택적 메서드 (덜 안전하지만 필요시 사용) ===
  
  /**
   * Authorization 헤더만 받기 (RN에서 직접 fetch 할 때)
   * @returns Promise<string | null> Bearer 토큰 또는 null
   */
  getAuthHeader?(): Promise<string | null>;

  // === 이벤트 리스너 (Native → RN 상태 알림) ===
  
  /**
   * 인증 상태 변경 이벤트 리스너 등록
   * @param listener 상태 변경 콜백
   */
  addAuthStatusListener(listener: (status: AuthStatus, data?: any) => void): void;

  /**
   * 인증 상태 변경 이벤트 리스너 제거
   * @param listener 제거할 콜백
   */
  removeAuthStatusListener(listener: (status: AuthStatus, data?: any) => void): void;
}

/**
 * 실제 구현을 위한 Mock Bridge (개발/테스트용)
 * 안드로이드 네이티브 모듈 구현 전까지 사용
 */
export class MockReactNativeBridge implements ReactNativeBridge {
  private isAuthenticated: boolean = false;
  private mockUser: SessionInfo['userProfile'] | undefined;
  private listeners: Array<(status: AuthStatus, data?: any) => void> = [];

  // === 핵심 4개 메서드 구현 ===

  async startOAuth(provider: OAuthProvider): Promise<boolean> {
    console.log(`[MockBridge] OAuth 로그인 시작: ${provider}`);
    
    // 이벤트 발생: 로그인 시작
    this.notifyListeners("started", { provider });
    
    // Mock 지연 (실제로는 Custom Tabs 열리고 사용자 인증)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 이벤트 발생: 콜백 수신
    this.notifyListeners("callback_received", { provider });
    
    // Mock 성공 처리
    this.isAuthenticated = true;
    this.mockUser = {
      sub: `mock_user_${provider}_${Date.now()}`,
      email: `user@${provider}.com`,
      name: `${provider} 사용자`,
      provider
    };
    
    // 이벤트 발생: 로그인 성공
    this.notifyListeners("success", { user: this.mockUser });
    
    return true;
  }

  async getSession(): Promise<SessionInfo> {
    console.log(`[MockBridge] 세션 상태 확인: ${this.isAuthenticated}`);
    
    return {
      isLoggedIn: this.isAuthenticated,
      userProfile: this.mockUser
    };
  }

  async signOut(): Promise<boolean> {
    console.log(`[MockBridge] 로그아웃 처리`);
    
    this.isAuthenticated = false;
    this.mockUser = undefined;
    
    // 이벤트 발생: 로그아웃
    this.notifyListeners("signed_out");
    
    return true;
  }

  async callWithAuth(request: AuthenticatedRequest): Promise<AuthenticatedResponse> {
    console.log(`[MockBridge] 보호된 API 대리호출: ${request.method} ${request.url}`);
    
    if (!this.isAuthenticated) {
      return {
        success: false,
        status: 401,
        headers: {},
        error: '인증되지 않은 사용자입니다.'
      };
    }

    // Mock 토큰 갱신 시뮬레이션 (가끔)
    if (Math.random() < 0.1) { // 10% 확률로 토큰 갱신
      this.notifyListeners("token_refreshed");
    }

    // Mock 성공 응답
    return {
      success: true,
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: {
        message: 'Mock 보호된 API 호출 성공',
        user: this.mockUser,
        timestamp: new Date().toISOString()
      }
    };
  }

  // === 선택적 메서드 ===

  async getAuthHeader(): Promise<string | null> {
    console.log(`[MockBridge] Authorization 헤더 요청`);
    
    if (!this.isAuthenticated) {
      return null;
    }

    return `Bearer mock_access_token_${Date.now()}`;
  }

  // === 이벤트 시스템 ===

  addAuthStatusListener(listener: (status: AuthStatus, data?: any) => void): void {
    this.listeners.push(listener);
    console.log(`[MockBridge] 이벤트 리스너 등록 (총 ${this.listeners.length}개)`);
  }

  removeAuthStatusListener(listener: (status: AuthStatus, data?: any) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log(`[MockBridge] 이벤트 리스너 제거 (총 ${this.listeners.length}개)`);
    }
  }

  private notifyListeners(status: AuthStatus, data?: any): void {
    console.log(`[MockBridge] 이벤트 발생: ${status}`, data);
    this.listeners.forEach(listener => {
      try {
        listener(status, data);
      } catch (error) {
        console.error('[MockBridge] 이벤트 리스너 오류:', error);
      }
    });
  }

  // === Mock 전용 헬퍼 메서드 ===

  /**
   * 강제로 토큰 만료 상황 시뮬레이션
   */
  simulateTokenExpiry(): void {
    console.log(`[MockBridge] 토큰 만료 시뮬레이션`);
    this.notifyListeners("error", { error: 'token_expired' });
  }

  /**
   * 강제로 토큰 갱신 시뮬레이션
   */
  simulateTokenRefresh(): void {
    console.log(`[MockBridge] 토큰 갱신 시뮬레이션`);
    this.notifyListeners("token_refreshed");
  }
}
