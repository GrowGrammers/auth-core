import { 
  TokenStore, 
  SaveTokenResponse, 
  GetTokenResponse, 
  RemoveTokenResponse, 
  HasTokenResponse, 
  IsTokenExpiredResponse, 
  ClearResponse 
} from '../TokenStore.interface';
import { Token } from '../../shared/types';
import { ReactNativeBridge, SessionInfo } from '../interfaces/ReactNativeBridge';
import { 
  createTokenSaveErrorResponse, 
  createTokenReadErrorResponse, 
  createTokenDeleteErrorResponse, 
  createStorageClearErrorResponse
} from '../../shared/utils/errorUtils';
import { createStorageSuccessResponse } from '../index';
import { createErrorResponse } from '../../shared/utils';

/**
 * React Native용 TokenStore 구현체 (M2(A) 패턴)
 * 
 * - RN은 "로그인됨/로그아웃됨" 상태만 관리
 * - 실제 토큰은 모두 네이티브가 관리 (getSession() 기반)
 * - 기존 TokenStore 인터페이스 호환성 유지
 * 
 * 사용법:
 * import { MockReactNativeBridge } from '../interfaces/ReactNativeBridge';
 * const tokenStore = new ReactNativeTokenStore(nativeBridge);
 */
export class ReactNativeTokenStore implements TokenStore {
  private nativeBridge: ReactNativeBridge;

  constructor(nativeBridge: ReactNativeBridge) {
    this.nativeBridge = nativeBridge;
  }

  /**
   * 토큰 저장 - 실제로는 네이티브에서 이미 처리됨 (호환성을 위해서만 존재)
   */
  async saveToken(token: Token): Promise<SaveTokenResponse> {
    try {
      // 네이티브가 OAuth 완료 시 자동으로 저장하므로 성공 응답만 반환
      //console.log('[ReactNativeTokenStore] 토큰 저장 요청 - 네이티브에서 이미 처리됨');
      
      return createStorageSuccessResponse(
        '토큰이 네이티브에서 관리되고 있습니다.', 
        undefined
      );
    } catch (error) {
      console.error('[ReactNativeTokenStore] saveToken 오류:', error);
      return createTokenSaveErrorResponse('토큰 저장 상태를 확인할 수 없습니다.');
    }
  }

  /**
   * 토큰 조회 - getSession()을 통해 로그인 상태 기반으로 가상 토큰 반환
   */
  async getToken(): Promise<GetTokenResponse> {
    try {
      const session = await this.nativeBridge.getSession();
      
      if (!session.isLoggedIn) {
        return createStorageSuccessResponse('세션이 없습니다.', null);
      }

      // auth-core 호환성을 위한 가상 토큰 객체
      const virtualToken: Token = {
        accessToken: 'managed_by_native', // 실제 값은 네이티브가 관리
        refreshToken: 'managed_by_native',
        expiredAt: Date.now() + 3600000 // 1시간 후 (실제로는 네이티브가 관리)
      };

      return createStorageSuccessResponse(
        '로그인 세션이 활성화되어 있습니다.', 
        virtualToken
      );
    } catch (error) {
      console.error('[ReactNativeTokenStore] getToken 오류:', error);
      return createTokenReadErrorResponse('로그인 상태를 확인할 수 없습니다.');
    }
  }

  /**
   * 토큰 삭제 - signOut() 호출
   */
  async removeToken(): Promise<RemoveTokenResponse> {
    try {
      const success = await this.nativeBridge.signOut();
      
      if (success) {
        return createStorageSuccessResponse(
          '로그아웃이 완료되었습니다.', 
          undefined
        );
      } else {
        return createTokenDeleteErrorResponse('로그아웃 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('[ReactNativeTokenStore] removeToken 오류:', error);
      return createTokenDeleteErrorResponse('로그아웃 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 존재 여부 확인 - getSession()의 isLoggedIn 상태 반환
   */
  async hasToken(): Promise<HasTokenResponse> {
    try {
      const session = await this.nativeBridge.getSession();
      
      return createStorageSuccessResponse(
        session.isLoggedIn ? '로그인 세션이 활성화되어 있습니다.' : '로그인 세션이 없습니다.',
        session.isLoggedIn
      );
    } catch (error) {
      console.error('[ReactNativeTokenStore] hasToken 오류:', error);
      return {
        success: false,
        message: '세션 상태 확인에 실패했습니다.',
        data: null,
        error: '세션 상태 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 토큰 만료 여부 확인 - 세션 상태 기반으로 판단
   */
  async isTokenExpired(): Promise<IsTokenExpiredResponse> {
    try {
      const session = await this.nativeBridge.getSession();
      
      // 로그인 세션이 없으면 "만료됨"으로 간주
      const isExpired = !session.isLoggedIn;
      
      return createStorageSuccessResponse(
        isExpired ? '세션이 만료되었습니다.' : '세션이 활성화되어 있습니다.',
        isExpired
      );
    } catch (error) {
      console.error('[ReactNativeTokenStore] isTokenExpired 오류:', error);
      // 오류 시 만료된 것으로 간주 (보안상 안전)
      return createStorageSuccessResponse(
        '세션 상태 확인 실패, 만료로 처리',
        true
      );
    }
  }

  /**
   * 저장소 초기화 - signOut() 호출
   */
  async clear(): Promise<ClearResponse> {
    try {
      const success = await this.nativeBridge.signOut();
      
      if (success) {
        return createStorageSuccessResponse(
          '모든 세션 데이터가 초기화되었습니다.',
          undefined
        );
      } else {
        return createStorageClearErrorResponse('세션 초기화 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('[ReactNativeTokenStore] clear 오류:', error);
      return createStorageClearErrorResponse('세션 초기화 중 오류가 발생했습니다.');
    }
  }

  // === 새로운 간소화된 메서드들 ===

  /**
   * 현재 세션 정보 조회
   */
  async getSessionInfo(): Promise<SessionInfo> {
    return await this.nativeBridge.getSession();
  }

  /**
   * OAuth 로그인 시작
   */
  async startOAuth(provider: 'google' | 'kakao'): Promise<boolean> {
    return await this.nativeBridge.startOAuth(provider);
  }

  /**
   * 보호된 API 호출
   */
  async callWithAuth(request: any): Promise<any> {
    return await this.nativeBridge.callWithAuth(request);
  }

  /**
   * 네이티브 브릿지 상태 확인
   */
  async isNativeBridgeHealthy(): Promise<boolean> {
    try {
      await this.nativeBridge.getSession();
      return true;
    } catch (error) {
      console.error('[ReactNativeTokenStore] 네이티브 브릿지 상태 확인 실패:', error);
      return false;
    }
  }
}
