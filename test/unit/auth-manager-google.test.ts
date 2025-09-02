import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from '../../src/AuthManager';
import { GoogleAuthProviderConfig } from '../../src/providers/interfaces/config/auth-config';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { InMemoryTokenStore } from '../mocks/InMemoryTokenStore';

// Google Auth API 모킹
vi.mock('../../src/network/googleAuthApi', () => ({
  validateTokenByGoogle: vi.fn(),
  getUserInfoByGoogle: vi.fn(),
  checkGoogleServiceAvailability: vi.fn(),
  loginByGoogle: vi.fn(),
  logoutByGoogle: vi.fn(),
  refreshTokenByGoogle: vi.fn()
}));

describe('AuthManager Google OAuth 통합 테스트', () => {
  let authManager: AuthManager;
  let mockHttpClient: FakeHttpClient;
  let mockApiConfig: any;
  let mockConfig: GoogleAuthProviderConfig;

  beforeEach(async () => {
    mockHttpClient = new FakeHttpClient();
    mockApiConfig = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        googleLogin: '/auth/google/login',
        googleLogout: '/auth/google/logout',
        googleRefresh: '/auth/google/refresh',
        googleValidate: '/auth/google/validate',
        googleUserinfo: '/auth/google/userinfo',
        health: '/health'
      }
    };
    mockConfig = {
      googleClientId: 'test-google-client-id',
      timeout: 10000,
      retryCount: 3
    };

    // Google Provider를 직접 생성하여 AuthManager에 주입
    const { GoogleAuthProvider } = await import('../../src/providers/implementations/GoogleAuthProvider');
    const googleProvider = new GoogleAuthProvider(mockConfig, mockHttpClient, mockApiConfig);
    
    authManager = new AuthManager({
      provider: googleProvider,
      apiConfig: mockApiConfig,
      httpClient: mockHttpClient,
      tokenStore: new InMemoryTokenStore()
    });
  });

  describe('Google OAuth 로그인', () => {
    it('Google OAuth Authorization Code로 로그인을 성공해야 한다', async () => {
      const { loginByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(loginByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 로그인 성공',
        data: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          expiredAt: Date.now() + 3600000,
          userInfo: {
            id: 'google-user-123',
            email: 'user@gmail.com',
            nickname: 'Google User',
            provider: 'google'
          }
        }
      });

      const authCode = 'google-auth-code-123';
      const result = await authManager.login({
        provider: 'google',
        authCode: authCode
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.accessToken).toBe('google-access-token');
        expect(result.data?.refreshToken).toBe('google-refresh-token');
        expect(result.data?.userInfo.provider).toBe('google');
      }
    });

    it('Google 로그인 실패 시 에러를 반환해야 한다', async () => {
      const { loginByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(loginByGoogle).mockResolvedValue({
        success: false,
        error: 'Google OAuth 인증 실패',
        message: 'Google 계정 인증에 실패했습니다.',
        data: null
      });

      const authCode = 'invalid-auth-code';
      const result = await authManager.login({
        provider: 'google',
        authCode: authCode
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google OAuth 인증 실패');
        expect(result.message).toBe('Google 계정 인증에 실패했습니다.');
      }
    });

    it('Google Provider가 아닌 경우 에러를 반환해야 한다', async () => {
      // Email Provider로 AuthManager 생성
      const emailAuthManager = new AuthManager({
        providerType: 'email',
        apiConfig: mockApiConfig,
        httpClient: mockHttpClient,
        tokenStore: new InMemoryTokenStore()
      });

      const authCode = 'google-auth-code';
      const result = await emailAuthManager.login({
        provider: 'google',
        authCode: authCode
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 로그인을 지원하지 않는 제공자입니다.');
      }
    });
  });

  describe('Google OAuth 토큰 검증', () => {
    it('Google 토큰 검증을 성공해야 한다', async () => {
      // 먼저 토큰 저장
      const token = {
        accessToken: 'valid-google-token',
        refreshToken: 'google-refresh-token',
        expiredAt: Date.now() + 3600000
      };
      await authManager['tokenStore'].saveToken(token);

      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 토큰 검증 성공',
        data: true
      });

      const result = await authManager.validateCurrentToken();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('Google 토큰 검증 실패 시 에러를 반환해야 한다', async () => {
      // 먼저 토큰 저장
      const token = {
        accessToken: 'expired-google-token',
        refreshToken: 'google-refresh-token',
        expiredAt: Date.now() + 3600000
      };
      await authManager['tokenStore'].saveToken(token);

      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: false,
        error: 'Google 토큰이 유효하지 않습니다',
        message: '제공된 Google 토큰이 만료되었습니다.',
        data: null
      });

      const result = await authManager.validateCurrentToken();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 토큰이 유효하지 않습니다');
      }
    });
  });

  describe('Google OAuth 사용자 정보 조회', () => {
    it('Google 사용자 정보 조회를 성공해야 한다', async () => {
      // 먼저 토큰 저장
      const token = {
        accessToken: 'valid-google-token',
        refreshToken: 'google-refresh-token',
        expiredAt: Date.now() + 3600000
      };
      await authManager['tokenStore'].saveToken(token);

      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 사용자 정보 조회 성공',
        data: {
          id: 'google-user-456',
          email: 'test@gmail.com',
          nickname: 'Test User',
          provider: 'google'
        }
      });

      const result = await authManager.getCurrentUserInfo();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.email).toBe('test@gmail.com');
        expect(result.data?.provider).toBe('google');
      }
    });

    it('Google 사용자 정보 조회 실패 시 에러를 반환해야 한다', async () => {
      // 먼저 토큰 저장
      const token = {
        accessToken: 'invalid-google-token',
        refreshToken: 'google-refresh-token',
        expiredAt: Date.now() + 3600000
      };
      await authManager['tokenStore'].saveToken(token);

      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: false,
        error: 'Google 사용자 정보 조회 실패',
        message: 'Google 계정 정보를 가져올 수 없습니다.',
        data: null
      });

      const result = await authManager.getCurrentUserInfo();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 사용자 정보 조회 실패');
      }
    });
  });

  describe('Google OAuth 서비스 가용성 확인', () => {
    it('Google 서비스 가용성을 성공적으로 확인해야 한다', async () => {
      const { checkGoogleServiceAvailability } = await import('../../src/network/googleAuthApi');
      vi.mocked(checkGoogleServiceAvailability).mockResolvedValue({
        success: true,
        message: 'Google 서비스 정상',
        data: true
      });

      // Provider의 isAvailable 메서드 직접 호출
      const result = await authManager['provider'].isAvailable();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('Google 서비스 가용성 확인 실패 시 에러를 반환해야 한다', async () => {
      const { checkGoogleServiceAvailability } = await import('../../src/network/googleAuthApi');
      vi.mocked(checkGoogleServiceAvailability).mockResolvedValue({
        success: false,
        error: 'Google 서비스 일시적 장애',
        message: 'Google OAuth 서비스가 일시적으로 사용할 수 없습니다.',
        data: null
      });

      // Provider의 isAvailable 메서드 직접 호출
      const result = await authManager['provider'].isAvailable();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 서비스 일시적 장애');
      }
    });
  });

  describe('Google OAuth 로그아웃', () => {
    it('Google 로그아웃을 성공해야 한다', async () => {
      // 먼저 토큰 저장
      const token = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        expiredAt: Date.now() + 3600000
      };
      await authManager['tokenStore'].saveToken(token);

      const { logoutByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(logoutByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 로그아웃 성공',
        data: undefined
      });

      const result = await authManager.logout({
        provider: 'google'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Google 로그아웃 성공');
      }

      // 토큰이 삭제되었는지 확인
      const tokenResult = await authManager.getToken();
      expect(tokenResult.success).toBe(true);
      if (tokenResult.success) {
        expect(tokenResult.data).toBe(null);
      }
    });

    it('저장된 Google 토큰이 없으면 에러를 반환해야 한다', async () => {
      const result = await authManager.logout({
        provider: 'google'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('저장된 토큰이 없습니다.');
      }
    });
  });

  describe('Google OAuth 통합 플로우', () => {
    it('Google 로그인 → 토큰 검증 → 사용자 정보 조회 → 로그아웃 전체 플로우를 성공해야 한다', async () => {
      // 1. Google 로그인
      const { loginByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(loginByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 로그인 성공',
        data: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          expiredAt: Date.now() + 3600000,
          userInfo: {
            id: 'google-user-789',
            email: 'flow@gmail.com',
            nickname: 'Flow User',
            provider: 'google'
          }
        }
      });

      const authCode = 'flow-auth-code';
      const loginResult = await authManager.login({
        provider: 'google',
        authCode: authCode
      });
      expect(loginResult.success).toBe(true);

      // 2. 토큰 검증
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 토큰 검증 성공',
        data: true
      });

      const validationResult = await authManager.validateCurrentToken();
      expect(validationResult.success).toBe(true);

      // 3. 사용자 정보 조회
      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 사용자 정보 조회 성공',
        data: {
          id: 'google-user-789',
          email: 'flow@gmail.com',
          nickname: 'Flow User',
          provider: 'google'
        }
      });

      const userInfoResult = await authManager.getCurrentUserInfo();
      expect(userInfoResult.success).toBe(true);

      // 4. 로그아웃
      const { logoutByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(logoutByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 로그아웃 성공',
        data: undefined
      });

      const logoutResult = await authManager.logout({
        provider: 'google'
      });
      expect(logoutResult.success).toBe(true);

      // 5. 인증 상태 확인
      const authStatusResult = await authManager.isAuthenticated();
      expect(authStatusResult.success).toBe(true);
      if (authStatusResult.success) {
        expect(authStatusResult.data).toBe(false); // 로그아웃 후 인증 해제
      }
    });
  });
});
