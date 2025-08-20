import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthManager } from '../../src/AuthManager';
import { FakeAuthProvider } from '../mocks/FakeAuthProvider';
import { InMemoryTokenStore } from '../mocks/InMemoryTokenStore';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { ApiConfig } from '../../src/shared/types';

describe('AuthManager (단위 테스트 - 백엔드 없음)', () => {
  let manager: AuthManager;
  let fakeProvider: FakeAuthProvider;
  let fakeTokenStore: InMemoryTokenStore;
  let fakeHttpClient: FakeHttpClient;
  let apiConfig: ApiConfig;

  beforeEach(() => {
    // 테스트 더블들 초기화
    fakeProvider = new FakeAuthProvider();
    fakeTokenStore = new InMemoryTokenStore();
    fakeHttpClient = new FakeHttpClient();
    
    apiConfig = {
      apiBaseUrl: 'https://fake-api.example.com',
      endpoints: {
        requestVerification: '/auth/verify',
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        validate: '/auth/validate',
        me: '/auth/me',
        health: '/auth/health'
      }
    };

    // AuthManager 생성 (테스트 더블들 주입)
    manager = new AuthManager({
      provider: fakeProvider,
      apiConfig,
      httpClient: fakeHttpClient,
      tokenStore: fakeTokenStore
    });
  });

  afterEach(() => {
    // 각 테스트 후 상태 초기화
    fakeProvider.reset();
    fakeTokenStore.reset();
    fakeHttpClient.reset();
  });

  describe('로그인 플로우', () => {
    it('정상 로그인 시 토큰 저장 및 사용자 정보 반환', async () => {
      // Given: 정상적인 로그인 요청
      const loginRequest = { email: 'test@example.com', verificationCode: '123456', provider: 'email' as const };

      // When: 로그인 실행
      const result = await manager.login(loginRequest);

      // Then: 성공 응답 확인
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.userInfo.email).toBe('test@example.com');
        expect(result.data?.userInfo.nickname).toBe('테스트 사용자');
        expect(result.data?.accessToken).toBe('fake-access-token-123');
      }

      // Then: 토큰이 저장소에 저장되었는지 확인
      const savedToken = await manager.getToken();
      expect(savedToken.success).toBe(true);
      if (savedToken.success) {
        expect(savedToken.data?.accessToken).toBe('fake-access-token-123');
      }
    });

    it('로그인 실패 시 에러 응답 반환', async () => {
      // Given: 실패할 로그인 요청
      const loginRequest = { email: 'fail@example.com', verificationCode: 'wrong', provider: 'email' as const };

      // When & Then: 로그인 실패 확인
      const result = await manager.login(loginRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('로그인 실패');
      }
    });

    it('로그인 타임아웃 시 에러 처리', async () => {
      // Given: 타임아웃이 발생할 로그인 요청
      const loginRequest = { email: 'timeout@example.com', verificationCode: '123456', provider: 'email' as const };

      // When & Then: 타임아웃 에러 확인
      const result = await manager.login(loginRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('타임아웃');
      }
    });
  });

  describe('토큰 관리', () => {
    it('토큰 저장 및 조회', async () => {
      // Given: 로그인으로 토큰 획득
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // When: 토큰 조회
      const tokenResult = await manager.getToken();

      // Then: 토큰이 정상적으로 저장되고 조회됨
      expect(tokenResult.success).toBe(true);
      if (tokenResult.success) {
        expect(tokenResult.data?.accessToken).toBe('fake-access-token-123');
        expect(tokenResult.data?.refreshToken).toBe('fake-refresh-token-123');
      }
    });

    it('토큰 존재 여부 확인', async () => {
      // Given: 초기 상태 (토큰 없음)
      let isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(false);
      }

      // When: 로그인으로 토큰 획득
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // Then: 토큰 존재 확인
      isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(true);
      }
    });

    it('토큰 만료 여부 확인', async () => {
      // Given: 로그인으로 토큰 획득
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // When: 토큰 만료 여부 확인 (validateCurrentToken 사용)
      const validationResult = await manager.validateCurrentToken();

      // Then: 토큰이 만료되지 않음
      expect(validationResult.success).toBe(true);
      if (validationResult.success) {
        expect(validationResult.data).toBe(true);
      }
    });
  });

  describe('토큰 갱신', () => {
    it('리프레시 토큰으로 액세스 토큰 갱신', async () => {
      // Given: 로그인으로 토큰 획득
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // When: 토큰 갱신
      const refreshResult = await manager.refreshToken({ refreshToken: 'fake-refresh-token-123', provider: 'email' as const });

      // Then: 새로운 액세스 토큰 발급
      expect(refreshResult.success).toBe(true);
      if (refreshResult.success) {
        expect(refreshResult.data?.accessToken).toBe('fake-access-token-456');
        expect(refreshResult.data?.refreshToken).toBe('fake-refresh-token-123');
      }

      // Then: 저장소에 새 토큰이 저장됨
      const savedToken = await manager.getToken();
      expect(savedToken.success).toBe(true);
      if (savedToken.success) {
        expect(savedToken.data?.accessToken).toBe('fake-access-token-456');
      }
    });

    it('유효하지 않은 리프레시 토큰으로 갱신 시도 시 실패', async () => {
      // Given: 잘못된 리프레시 토큰
      const invalidRefreshToken = 'invalid-refresh-token';

      // When & Then: 갱신 실패 확인
      const result = await manager.refreshToken({ refreshToken: invalidRefreshToken, provider: 'email' as const });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('리프레시 토큰이 유효하지 않습니다');
      }
    });
  });

  describe('로그아웃 플로우', () => {
    it('로그아웃 시 토큰 및 사용자 정보 정리', async () => {
      // Given: 로그인된 상태
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // Then: 로그인 후 토큰이 저장소에 있는지 확인
      const tokenBeforeLogout = await manager.getToken();
      expect(tokenBeforeLogout.success).toBe(true);
      if (tokenBeforeLogout.success) {
        expect(tokenBeforeLogout.data?.accessToken).toBe('fake-access-token-123');
      }

      // When: 로그아웃 실행
      const logoutResult = await manager.logout({ provider: 'email' as const });

      // Then: 로그아웃 성공
      expect(logoutResult.success).toBe(true);

      // Then: 토큰이 저장소에서 제거됨
      const tokenResult = await manager.getToken();
      expect(tokenResult.success).toBe(true);
      if (tokenResult.success) {
        expect(tokenResult.data).toBeNull();
      }

      // Then: 토큰 존재 여부가 false
      const isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(false);
      }
    });

    it('토큰이 없는 상태에서 로그아웃 시도 시 에러 처리', async () => {
      // Given: 토큰이 없는 상태 (초기 상태)
      const tokenResult = await manager.getToken();
      expect(tokenResult.success).toBe(true);
      if (tokenResult.success) {
        expect(tokenResult.data).toBeNull();
      }

      // When: 로그아웃 실행
      const logoutResult = await manager.logout({ provider: 'email' as const });

      // Then: 로그아웃 실패 (액세스 토큰이 필요함)
      expect(logoutResult.success).toBe(false);
      if (!logoutResult.success) {
        expect(logoutResult.message).toContain('액세스 토큰이 필요합니다');
      }
    });
  });

  describe('이메일 인증', () => {
    it('이메일 인증번호 요청 성공', async () => {
      // Given: 정상적인 이메일
      const emailRequest = { email: 'test@example.com' };

      // When: 인증번호 요청
      const result = await manager.requestEmailVerification(emailRequest);

      // Then: 요청 성공
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('인증번호가 이메일로 전송되었습니다.');
        // data는 void이므로 message만 확인
      }
    });

    it('이메일 인증번호 요청 실패', async () => {
      // Given: 잘못된 이메일
      const emailRequest = { email: 'invalid@example.com' };

      // When & Then: 요청 실패 확인
      const result = await manager.requestEmailVerification(emailRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('이메일 인증 요청 실패');
      }
    });
  });

  describe('인증 상태 관리', () => {
    it('인증 상태 확인', async () => {
      // Given: 초기 상태 (미인증)
      let isAuthenticated = await manager.isAuthenticated();
      expect(isAuthenticated.success).toBe(true);
      if (isAuthenticated.success) {
        expect(isAuthenticated.data).toBe(false);
      }

      // When: 로그인
      await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });

      // Then: 인증됨
      isAuthenticated = await manager.isAuthenticated();
      expect(isAuthenticated.success).toBe(true);
      if (isAuthenticated.success) {
        expect(isAuthenticated.data).toBe(true);
      }

      // When: 로그아웃
      await manager.logout({ provider: 'email' as const });

      // Then: 미인증
      isAuthenticated = await manager.isAuthenticated();
      expect(isAuthenticated.success).toBe(true);
      if (isAuthenticated.success) {
        expect(isAuthenticated.data).toBe(false);
      }
    });
  });

  describe('에러 처리', () => {
    it('네트워크 에러 시 적절한 에러 응답', async () => {
      // Given: 네트워크 에러를 시뮬레이션하는 AuthProvider
      const networkErrorProvider = {
        ...fakeProvider,
        login: async () => {
          throw new Error('Network Error');
        },
        logout: fakeProvider.logout.bind(fakeProvider),
        refreshToken: fakeProvider.refreshToken.bind(fakeProvider),
        validateToken: fakeProvider.validateToken.bind(fakeProvider),
        getUserInfo: fakeProvider.getUserInfo.bind(fakeProvider),
        isAvailable: fakeProvider.isAvailable.bind(fakeProvider),
        requestEmailVerification: fakeProvider.requestEmailVerification.bind(fakeProvider)
      };

      const errorManager = new AuthManager({
        provider: networkErrorProvider,
        apiConfig,
        httpClient: fakeHttpClient,
        tokenStore: fakeTokenStore
      });

      // When & Then: 네트워크 에러 처리 확인
      const result = await errorManager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('로그인 중 오류가 발생했습니다');
      }
    });
  });

  describe('통합 시나리오', () => {
    it('전체 인증 라이프사이클 테스트', async () => {
      // 1. 초기 상태 확인
      let isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(false);
      }

      // 2. 로그인
      const loginResult = await manager.login({ email: 'test@example.com', verificationCode: '123456', provider: 'email' as const });
      expect(loginResult.success).toBe(true);

      // 3. 인증 상태 확인
      isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(true);
      }

      // 4. 토큰 갱신
      const refreshResult = await manager.refreshToken({ refreshToken: 'fake-refresh-token-123', provider: 'email' as const });
      expect(refreshResult.success).toBe(true);

      // 5. 로그아웃
      const logoutResult = await manager.logout({ provider: 'email' as const });
      expect(logoutResult.success).toBe(true);

      // 6. 최종 상태 확인
      isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(false);
      }
    });
  });
});
