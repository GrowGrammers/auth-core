// AuthManager React Native 지원 단위 테스트
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthManager, AuthManagerConfig } from '../../src/AuthManager';
import { MockReactNativeBridge } from '../../src/storage/interfaces/ReactNativeBridge';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { ApiConfig } from '../../src/shared/types';

describe('AuthManager React Native 지원', () => {
  let mockNativeBridge: MockReactNativeBridge;
  let httpClient: FakeHttpClient;
  let apiConfig: ApiConfig;

  beforeEach(() => {
    mockNativeBridge = new MockReactNativeBridge();
    httpClient = new FakeHttpClient();
    apiConfig = {
      apiBaseUrl: 'https://api.example.com',
      timeout: 10000,
      retryCount: 3
    };
  });

  describe('React Native 설정 검증', () => {
    it('React Native 플랫폼에서 nativeBridge 없이 생성하면 에러를 발생시켜야 한다', () => {
      const config: AuthManagerConfig = {
        providerType: 'google',
        apiConfig,
        httpClient,
        providerConfig: { googleClientId: 'test-google-client-id' },
        platform: 'react-native'
        // nativeBridge 누락
      };

      expect(() => new AuthManager(config)).toThrow('React Native 플랫폼에서는 nativeBridge가 필수입니다');
    });

    it('nativeBridge가 있으면 React Native 플랫폼으로 정상 생성되어야 한다', () => {
      const config: AuthManagerConfig = {
        providerType: 'google',
        apiConfig,
        httpClient,
        providerConfig: { googleClientId: 'test-google-client-id' },
        platform: 'react-native',
        nativeBridge: mockNativeBridge,
        tokenStoreType: 'react-native'
      };

      expect(() => new AuthManager(config)).not.toThrow();
      const authManager = new AuthManager(config);
      expect(authManager.isReactNativePlatform()).toBe(true);
    });

    it('tokenStoreType이 react-native이면 자동으로 React Native 플랫폼으로 인식해야 한다', () => {
      const config: AuthManagerConfig = {
        providerType: 'google',
        apiConfig,
        httpClient,
        providerConfig: { googleClientId: 'test-google-client-id' },
        tokenStoreType: 'react-native',
        nativeBridge: mockNativeBridge
      };

      const authManager = new AuthManager(config);
      expect(authManager.isReactNativePlatform()).toBe(true);
    });
  });

  describe('React Native 전용 메서드들', () => {
    let authManager: AuthManager;

    beforeEach(() => {
      const config: AuthManagerConfig = {
        providerType: 'google',
        apiConfig,
        httpClient,
        providerConfig: { googleClientId: 'test-google-client-id' },
        platform: 'react-native',
        nativeBridge: mockNativeBridge,
        tokenStoreType: 'react-native'
      };
      authManager = new AuthManager(config);
    });

    it('isReactNativePlatform()이 true를 반환해야 한다', () => {
      expect(authManager.isReactNativePlatform()).toBe(true);
    });

    it('isNativeBridgeHealthy()가 올바르게 동작해야 한다', async () => {
      const result = await authManager.isNativeBridgeHealthy();
      expect(result).toBe(true);
    });

    it('getNativeBridge()가 올바른 브릿지 인스턴스를 반환해야 한다', () => {
      const bridge = authManager.getNativeBridge();
      expect(bridge).toBe(mockNativeBridge);
    });

    it('startNativeOAuth()가 성공적으로 동작해야 한다', async () => {
      const result = await authManager.startNativeOAuth('google');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toContain('네이티브 OAuth 로그인이 시작되었습니다');
    });

    it('getCurrentSession()이 세션 정보를 반환해야 한다', async () => {
      // 먼저 로그인
      await authManager.startNativeOAuth('google');
      
      const session = await authManager.getCurrentSession();
      expect(session.isLoggedIn).toBe(true);
      expect(session.userProfile?.provider).toBe('google');
    });

    it('callProtectedAPI()가 보호된 API를 대리호출해야 한다', async () => {
      // 먼저 로그인
      await authManager.startNativeOAuth('google');
      
      const response = await authManager.callProtectedAPI({
        url: '/api/user/profile',
        method: 'GET'
      });
      
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
    });
  });

  describe('웹 플랫폼에서 React Native 메서드 호출', () => {
    let webAuthManager: AuthManager;

    beforeEach(() => {
      const config: AuthManagerConfig = {
        providerType: 'google',
        apiConfig,
        httpClient,
        providerConfig: { googleClientId: 'test-google-client-id' },
        platform: 'web' // 웹 플랫폼
      };
      webAuthManager = new AuthManager(config);
    });

    it('isReactNativePlatform()이 false를 반환해야 한다', () => {
      expect(webAuthManager.isReactNativePlatform()).toBe(false);
    });

    it('isNativeBridgeHealthy()가 경고와 함께 false를 반환해야 한다', async () => {
      const result = await webAuthManager.isNativeBridgeHealthy();
      expect(result).toBe(false);
    });

    it('getNativeBridge()가 경고와 함께 null을 반환해야 한다', () => {
      const bridge = webAuthManager.getNativeBridge();
      expect(bridge).toBe(null);
    });

    it('startNativeOAuth()가 에러를 반환해야 한다', async () => {
      const result = await webAuthManager.startNativeOAuth('google');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('React Native 플랫폼에서만 사용 가능');
    });

    it('getCurrentSession()이 에러를 발생시켜야 한다', async () => {
      await expect(webAuthManager.getCurrentSession()).rejects.toThrow('React Native 플랫폼에서만 사용 가능');
    });

    it('callProtectedAPI()가 에러를 발생시켜야 한다', async () => {
      await expect(webAuthManager.callProtectedAPI({
        url: '/api/test',
        method: 'GET'
      })).rejects.toThrow('React Native 플랫폼에서만 사용 가능');
    });
  });
});
