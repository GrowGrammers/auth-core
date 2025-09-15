import { AuthStatus, ReactNativeBridge } from '../interfaces/ReactNativeBridge';

/**
 * 인증 이벤트 핸들러 타입
 */
export interface AuthEventHandlers {
  onAuthStarted?: (data?: any) => void;
  onCallbackReceived?: (data?: any) => void;
  onAuthSuccess?: (data?: any) => void;
  onAuthError?: (data?: any) => void;
  onTokenRefreshed?: (data?: any) => void;
  onSignedOut?: (data?: any) => void;
}

/**
 * React Native에서 인증 이벤트를 쉽게 처리하기 위한 헬퍼 클래스
 * 안드로이드 네이티브에서 발생하는 인증 상태 변경을 RN에서 처리
 * 
 * 사용법:
 * ```typescript
 * const eventHandler = new AuthEventHandler(nativeBridge, {
 *   onAuthStarted: () => setLoading(true),
 *   onAuthSuccess: (data) => {
 *     setLoading(false);
 *     navigation.navigate('Home');
 *   },
 *   onAuthError: (data) => {
 *     setLoading(false);
 *     showErrorToast(data.error);
 *   }
 * });
 * 
 * // 컴포넌트 언마운트 시
 * eventHandler.destroy();
 * ```
 */
export class AuthEventHandler {
  private nativeBridge: ReactNativeBridge;
  private handlers: AuthEventHandlers;
  private listener: (status: AuthStatus, data?: any) => void;

  constructor(nativeBridge: ReactNativeBridge, handlers: AuthEventHandlers) {
    this.nativeBridge = nativeBridge;
    this.handlers = handlers;
    
    // 통합 이벤트 리스너 생성
    this.listener = this.handleAuthEvent.bind(this);
    
    // 네이티브 브릿지에 리스너 등록
    this.nativeBridge.addAuthStatusListener(this.listener);
    
    console.log('[AuthEventHandler] 이벤트 핸들러 초기화 완료');
  }

  /**
   * 인증 이벤트 처리 메인 로직
   */
  private handleAuthEvent(status: AuthStatus, data?: any): void {
    console.log(`[AuthEventHandler] 이벤트 수신: ${status}`, data);
    
    try {
      switch (status) {
        case "started":
          this.handlers.onAuthStarted?.(data);
          break;
          
        case "callback_received":
          this.handlers.onCallbackReceived?.(data);
          break;
          
        case "success":
          this.handlers.onAuthSuccess?.(data);
          break;
          
        case "error":
          this.handlers.onAuthError?.(data);
          break;
          
        case "token_refreshed":
          this.handlers.onTokenRefreshed?.(data);
          break;
          
        case "signed_out":
          this.handlers.onSignedOut?.(data);
          break;
          
        default:
          console.warn(`[AuthEventHandler] 알 수 없는 이벤트: ${status}`);
      }
    } catch (error) {
      console.error(`[AuthEventHandler] 이벤트 처리 중 오류 (${status}):`, error);
    }
  }

  /**
   * 특정 이벤트 핸들러 업데이트
   */
  updateHandlers(newHandlers: Partial<AuthEventHandlers>): void {
    this.handlers = { ...this.handlers, ...newHandlers };
    console.log('[AuthEventHandler] 핸들러 업데이트됨');
  }

  /**
   * 이벤트 핸들러 정리 (컴포넌트 언마운트 시 호출)
   */
  destroy(): void {
    this.nativeBridge.removeAuthStatusListener(this.listener);
    console.log('[AuthEventHandler] 이벤트 핸들러 정리 완료');
  }
}

/**
 * React Hook 스타일로 인증 이벤트를 처리하기 위한 팩토리 함수
 * 
 * 사용법:
 * ```typescript
 * function LoginScreen() {
 *   const [loading, setLoading] = useState(false);
 *   
 *   useEffect(() => {
 *     const eventHandler = createAuthEventHandler(nativeBridge, {
 *       onAuthStarted: () => setLoading(true),
 *       onAuthSuccess: () => {
 *         setLoading(false);
 *         navigation.navigate('Home');
 *       },
 *       onAuthError: (data) => {
 *         setLoading(false);
 *         Alert.alert('로그인 실패', data.error);
 *       }
 *     });
 *     
 *     return () => eventHandler.destroy();
 *   }, []);
 * }
 * ```
 */
export function createAuthEventHandler(
  nativeBridge: ReactNativeBridge, 
  handlers: AuthEventHandlers
): AuthEventHandler {
  return new AuthEventHandler(nativeBridge, handlers);
}

/**
 * 일반적인 인증 플로우를 위한 기본 핸들러 템플릿
 */
export function createDefaultAuthHandlers(
  setLoading: (loading: boolean) => void,
  onSuccess: (userData?: any) => void,
  onError: (error: string) => void,
  onSignOut?: () => void
): AuthEventHandlers {
  return {
    onAuthStarted: () => {
      console.log('[AuthHandlers] 로그인 시작');
      setLoading(true);
    },
    
    onCallbackReceived: () => {
      console.log('[AuthHandlers] 인증 콜백 수신');
      // 로딩은 유지, 토큰 교환 중이므로
    },
    
    onAuthSuccess: (data) => {
      console.log('[AuthHandlers] 로그인 성공', data);
      setLoading(false);
      onSuccess(data);
    },
    
    onAuthError: (data) => {
      console.log('[AuthHandlers] 로그인 실패', data);
      setLoading(false);
      onError(data?.error || '로그인 중 오류가 발생했습니다.');
    },
    
    onTokenRefreshed: () => {
      console.log('[AuthHandlers] 토큰 갱신됨');
      // 특별한 UI 처리 필요 없음 (백그라운드 갱신)
    },
    
    onSignedOut: () => {
      console.log('[AuthHandlers] 로그아웃됨');
      setLoading(false);
      onSignOut?.();
    }
  };
}
