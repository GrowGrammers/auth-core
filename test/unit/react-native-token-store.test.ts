// ReactNativeTokenStore 단위 테스트 (실제 합의사항 기반)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactNativeTokenStore } from '../../src/storage/implementations/ReactNativeTokenStore';
import { MockReactNativeBridge } from '../../src/storage/interfaces/ReactNativeBridge';
import { Token } from '../../src/shared/types';

describe('ReactNativeTokenStore', () => {
  let tokenStore: ReactNativeTokenStore;
  let mockNativeBridge: MockReactNativeBridge;

  beforeEach(() => {
    // Mock Native Bridge 생성
    mockNativeBridge = new MockReactNativeBridge();
    
    // ReactNativeTokenStore 인스턴스 생성 (간소화된 버전)
    tokenStore = new ReactNativeTokenStore(mockNativeBridge);
  });

  describe('saveToken', () => {
    it('토큰 저장 요청 시 성공 응답을 반환해야 한다', async () => {
      const token: Token = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiredAt: Date.now() + 3600000
      };

      const result = await tokenStore.saveToken(token);

      expect(result.success).toBe(true);
      expect(result.message).toContain('네이티브에서 관리');
    });

    it('모든 토큰 저장 요청은 성공 응답을 반환해야 한다', async () => {
      const invalidToken = {
        accessToken: '',
        refreshToken: 'test_refresh_token'
      } as Token;

      const result = await tokenStore.saveToken(invalidToken);

      // 실제 합의사항: 네이티브에서 관리하므로 항상 성공
      expect(result.success).toBe(true);
      expect(result.message).toContain('네이티브에서 관리');
    });
  });

  describe('getToken', () => {
    it('로그인된 상태에서 가상 토큰을 반환해야 한다', async () => {
      // Mock 로그인 상태 설정
      await mockNativeBridge.startOAuth('google');

      const result = await tokenStore.getToken();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        accessToken: 'managed_by_native',
        refreshToken: 'managed_by_native',
        expiredAt: expect.any(Number)
      });
    });

    it('로그아웃 상태에서 null을 반환해야 한다', async () => {
      // Mock은 기본적으로 로그아웃 상태
      const result = await tokenStore.getToken();

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
      expect(result.message).toContain('세션이 없습니다');
    });
  });

  describe('removeToken', () => {
    it('signOut을 호출하여 로그아웃해야 한다', async () => {
      // 먼저 로그인 상태로 설정
      await mockNativeBridge.startOAuth('google');

      const result = await tokenStore.removeToken();

      expect(result.success).toBe(true);
      expect(result.message).toContain('로그아웃이 완료');
      
      // 로그아웃 후 세션 상태 확인
      const session = await mockNativeBridge.getSession();
      expect(session.isLoggedIn).toBe(false);
    });

    it('로그아웃이 실패하면 에러를 반환해야 한다', async () => {
      // Mock signOut 실패 시뮬레이션
      vi.spyOn(mockNativeBridge, 'signOut').mockResolvedValue(false);

      const result = await tokenStore.removeToken();

      expect(result.success).toBe(false);
      expect(result.error).toBe('토큰 삭제 실패');
      expect(result.message).toContain('로그아웃 처리 중 오류');
    });
  });

  describe('hasToken', () => {
    it('로그인 상태에서 true를 반환해야 한다', async () => {
      await mockNativeBridge.startOAuth('google');

      const result = await tokenStore.hasToken();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toContain('로그인 세션이 활성화');
    });

    it('로그아웃 상태에서 false를 반환해야 한다', async () => {
      const result = await tokenStore.hasToken();

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.message).toContain('로그인 세션이 없습니다');
    });
  });

  describe('isTokenExpired', () => {
    it('로그인 상태에서 false를 반환해야 한다', async () => {
      await mockNativeBridge.startOAuth('google');

      const result = await tokenStore.isTokenExpired();

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.message).toContain('세션이 활성화');
    });

    it('로그아웃 상태에서 true를 반환해야 한다 (만료됨)', async () => {
      const result = await tokenStore.isTokenExpired();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toContain('세션이 만료');
    });
  });

  describe('clear', () => {
    it('signOut을 호출하여 모든 세션 데이터를 초기화해야 한다', async () => {
      await mockNativeBridge.startOAuth('google');

      const result = await tokenStore.clear();

      expect(result.success).toBe(true);
      expect(result.message).toContain('모든 세션 데이터가 초기화');
      
      // 초기화 후 세션 상태 확인
      const session = await mockNativeBridge.getSession();
      expect(session.isLoggedIn).toBe(false);
    });

    it('초기화가 실패하면 에러를 반환해야 한다', async () => {
      vi.spyOn(mockNativeBridge, 'signOut').mockResolvedValue(false);

      const result = await tokenStore.clear();

      expect(result.success).toBe(false);
      expect(result.error).toBe('저장소 초기화 실패');
      expect(result.message).toContain('세션 초기화 중 오류');
    });
  });

  describe('새로운 간소화된 메서드들', () => {
    describe('getSessionInfo', () => {
      it('현재 세션 정보를 반환해야 한다', async () => {
        await mockNativeBridge.startOAuth('google');

        const session = await tokenStore.getSessionInfo();

        expect(session.isLoggedIn).toBe(true);
        expect(session.userProfile?.provider).toBe('google');
        expect(session.userProfile?.sub).toContain('mock_user_google');
      });
    });

    describe('startOAuth', () => {
      it('OAuth 로그인을 시작해야 한다', async () => {
        const result = await tokenStore.startOAuth('kakao');

        expect(result).toBe(true);
        
        // 로그인 상태 확인
        const session = await tokenStore.getSessionInfo();
        expect(session.isLoggedIn).toBe(true);
        expect(session.userProfile?.provider).toBe('kakao');
      });
    });

    describe('callWithAuth', () => {
      it('보호된 API를 대리호출해야 한다', async () => {
        await mockNativeBridge.startOAuth('google');

        const response = await tokenStore.callWithAuth({
          url: '/api/user/profile',
          method: 'GET'
        });

        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.data.message).toContain('Mock 보호된 API 호출 성공');
      });

      it('로그아웃 상태에서 401 에러를 반환해야 한다', async () => {
        const response = await tokenStore.callWithAuth({
          url: '/api/user/profile',
          method: 'GET'
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error).toContain('인증되지 않은 사용자');
      });
    });

    describe('isNativeBridgeHealthy', () => {
      it('네이티브 브릿지 상태를 확인해야 한다', async () => {
        const result = await tokenStore.isNativeBridgeHealthy();

        expect(result).toBe(true);
      });
    });
  });
});
