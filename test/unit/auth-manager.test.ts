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
      apiBaseUrl: 'http://localhost:3000',
      endpoints: {
        requestVerification: '/api/v1/auth/email/request',
        verifyEmail: '/api/v1/auth/email/verify',
        login: '/api/v1/auth/members/email-login',
        logout: '/api/v1/auth/members/logout',
        refresh: '/api/v1/auth/members/refresh',
        validate: '/api/v1/auth/validate-token',
        me: '/api/v1/auth/user-info',
        health: '/api/v1/health',
        // 구글 인증 엔드포인트 추가
        googleLogin: '/api/v1/auth/google/login',
        googleLogout: '/api/v1/auth/google/logout',
        googleRefresh: '/api/v1/auth/google/refresh'
      },
      timeout: 10000
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
      // Given: 이메일 인증 완료
      await manager.requestEmailVerification({ email: 'test@example.com' });
      await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });

      // When: 로그인 실행
      const loginRequest = { email: 'test@example.com', provider: 'email' as const };
      const result = await manager.login(loginRequest);

       // Then: 성공 응답 확인
       expect(result.success).toBe(true);
       if (result.success) {
         expect(result.data?.userInfo.email).toBe('test@example.com');
         expect(result.data?.userInfo.nickname).toBe('테스트 사용자');
         expect(result.data?.accessToken).toBeDefined();
       }

       // Then: 토큰이 저장소에 저장되었는지 확인
       const savedToken = await manager.getToken();
       expect(savedToken.success).toBe(true);
       if (savedToken.success) {
         expect(savedToken.data?.accessToken).toBeDefined();
       }
    });

    it('로그인 실패 시 에러 응답 반환', async () => {
      // Given: 이메일 인증 완료
      await manager.requestEmailVerification({ email: 'fail@example.com' });
      await manager.verifyEmail({ email: 'fail@example.com', verifyCode: '123456' });

      // When: 실패할 로그인 시도
      const loginRequest = { email: 'fail@example.com', provider: 'email' as const };
      const result = await manager.login(loginRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('로그인 실패');
      }
    });

    it('로그인 타임아웃 시 에러 처리', async () => {
      // Given: 이메일 인증 완료
      await manager.requestEmailVerification({ email: 'timeout@example.com' });
      await manager.verifyEmail({ email: 'timeout@example.com', verifyCode: '123456' });

      // When: 타임아웃될 로그인 시도
      const loginRequest = { email: 'timeout@example.com', provider: 'email' as const };
      const result = await manager.login(loginRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('타임아웃');
      }
    });
  });

  describe('토큰 관리', () => {
    it('토큰 저장 및 조회', async () => {
      // Given: 이메일 인증 완료 후 로그인
      await manager.requestEmailVerification({ email: 'test@example.com' });
      await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
      const loginRequest = { email: 'test@example.com', provider: 'email' as const };
      await manager.login(loginRequest);

      // When: 저장된 토큰 조회
      const tokenResult = await manager.getToken();

      // Then: 토큰이 올바르게 저장되었는지 확인
      expect(tokenResult.success).toBe(true);
      if (tokenResult.success) {
        expect(tokenResult.data?.accessToken).toBeDefined();
        expect(tokenResult.data?.refreshToken).toBeDefined();
      }
    });

         it('토큰 존재 여부 확인', async () => {
       // Given: 이메일 인증 완료 후 로그인
       await manager.requestEmailVerification({ email: 'test@example.com' });
       await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       await manager.login(loginRequest);

      // When: 인증 상태 확인
      const isAuth = await manager.isAuthenticated();

      // Then: 인증됨 확인
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(true);
      }
    });

         it('토큰 만료 여부 확인', async () => {
       // Given: 이메일 인증 완료 후 로그인
       await manager.requestEmailVerification({ email: 'test@example.com' });
       await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       await manager.login(loginRequest);

      // When: 토큰 검증
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
       // Given: 이메일 인증 완료 후 로그인으로 토큰 획득
       await manager.requestEmailVerification({ email: 'test@example.com' });
       await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       await manager.login(loginRequest);

      // When: 토큰 갱신
      const refreshResult = await manager.refreshToken({ refreshToken: 'fake-refresh-token-123', provider: 'email' as const });

             // Then: 새로운 액세스 토큰 발급
       expect(refreshResult.success).toBe(true);
       if (refreshResult.success) {
         expect(refreshResult.data?.accessToken).toBeDefined();
         expect(refreshResult.data?.refreshToken).toBeDefined();
       }

       // Then: 저장소에 새 토큰이 저장됨
       const savedToken = await manager.getToken();
       expect(savedToken.success).toBe(true);
       if (savedToken.success) {
         expect(savedToken.data?.accessToken).toBeDefined();
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
       // Given: 이메일 인증 완료 후 로그인된 상태
       await manager.requestEmailVerification({ email: 'test@example.com' });
       await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       await manager.login(loginRequest);

             // Then: 로그인 후 토큰이 저장소에 있는지 확인
       const tokenBeforeLogout = await manager.getToken();
       expect(tokenBeforeLogout.success).toBe(true);
       if (tokenBeforeLogout.success) {
         expect(tokenBeforeLogout.data?.accessToken).toBeDefined();
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

    it('이메일 인증번호 확인 성공', async () => {
      // Given: 정상적인 이메일과 인증번호
      const verifyRequest = { 
        email: 'test@example.com', 
        verifyCode: '123456' 
      };

      // When: 인증번호 확인
      const result = await manager.verifyEmail(verifyRequest);

      // Then: 확인 성공
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('이메일 인증이 완료되었습니다.');
      }
    });

    it('이메일 인증번호 확인 실패', async () => {
      // Given: 잘못된 인증번호
      const verifyRequest = { 
        email: 'test@example.com', 
        verifyCode: '999999' 
      };

      // When & Then: 확인 실패 확인
      const result = await manager.verifyEmail(verifyRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('이메일 인증 실패');
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

             // When: 이메일 인증 완료 후 로그인
       await manager.requestEmailVerification({ email: 'test@example.com' });
       await manager.verifyEmail({ email: 'test@example.com', verifyCode: '123456' });
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       await manager.login(loginRequest);

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

             // When & Then: 네트워크 에러 처리 확인 (이메일 인증 없이 시도)
       const result = await errorManager.login({ email: 'test@example.com', provider: 'email' as const });
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

      // 2. 이메일 인증 요청
      const verificationRequest = { email: 'test@example.com' };
      const verificationResult = await manager.requestEmailVerification(verificationRequest);
      expect(verificationResult.success).toBe(true);

      // 3. 이메일 인증 확인
      const verifyResult = await manager.verifyEmail({
        email: 'test@example.com',
        verifyCode: '123456'
      });
      expect(verifyResult.success).toBe(true);

             // 4. 로그인
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       const loginResult = await manager.login(loginRequest);
      expect(loginResult.success).toBe(true);

      // 5. 인증 상태 확인
      isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(true);
      }

      // 6. 토큰 갱신
      const refreshResult = await manager.refreshToken({ refreshToken: 'fake-refresh-token-123', provider: 'email' as const });
      expect(refreshResult.success).toBe(true);

      // 7. 로그아웃
      const logoutResult = await manager.logout({ provider: 'email' as const });
      expect(logoutResult.success).toBe(true);

      // 8. 최종 상태 확인
      isAuth = await manager.isAuthenticated();
      expect(isAuth.success).toBe(true);
      if (isAuth.success) {
        expect(isAuth.data).toBe(false);
      }
    });
  });

  describe('API 형식 검증 테스트', () => {
    it('잘못된 API 형식으로 요청 시 에러 반환', async () => {
      // 잘못된 형식의 로그인 요청 (email 필드 누락)
      const invalidLoginRequest = { 
        provider: 'email' 
        // email 필드 누락
      } as any;

      const result = await manager.login(invalidLoginRequest);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('API 형식 오류');
      }
    });

    it('이메일 인증 없이 로그인 시도 시 차단', async () => {
      // 이메일 인증을 하지 않은 상태에서 로그인 시도
      const loginRequest = { 
        provider: 'email' as const,
        email: 'unverified@example.com' 
      };

      const result = await manager.login(loginRequest);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('EMAIL_VERIFICATION_REQUIRED');
      }
    });

    it('올바른 이메일 인증 플로우 후 로그인 성공', async () => {
      // 1. 이메일 인증 요청
      const verificationRequest = { email: 'test@example.com' };
      const verificationResult = await manager.requestEmailVerification(verificationRequest);
      expect(verificationResult.success).toBe(true);

      // 2. 이메일 인증 확인
      const verifyResult = await manager.verifyEmail({
        email: 'test@example.com',
        verifyCode: '123456'
      });
      expect(verifyResult.success).toBe(true);

             // 3. 로그인 시도 (이제 성공해야 함)
       const loginRequest = { email: 'test@example.com', provider: 'email' as const };
       const loginResult = await manager.login(loginRequest);
      expect(loginResult.success).toBe(true);
    });
  });
});
