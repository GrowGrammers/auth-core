import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NaverAuthProvider } from '../../src/providers/implementations/NaverAuthProvider';
import { NaverAuthProviderConfig } from '../../src/providers/interfaces/config/auth-config';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { Token } from '../../src/shared/types';

// Naver Auth API 모킹
vi.mock('../../src/network/naverAuthApi', () => ({
  validateTokenByNaver: vi.fn(),
  getUserInfoByNaver: vi.fn(),
  checkNaverServiceAvailability: vi.fn()
}));

// Network 모듈 모킹 (loginByNaver, logoutByNaver, refreshTokenByNaver가 여기서 export됨)
vi.mock('../../src/network', () => ({
  loginByNaver: vi.fn(),
  logoutByNaver: vi.fn(),
  refreshTokenByNaver: vi.fn()
}));

describe('NaverAuthProvider', () => {
  let naverProvider: NaverAuthProvider;
  let mockHttpClient: FakeHttpClient;
  let mockApiConfig: any;
  let mockConfig: NaverAuthProviderConfig;

  beforeEach(() => {
    mockHttpClient = new FakeHttpClient();
    mockApiConfig = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        naverLogin: '/auth/naver/login',
        naverLogout: '/auth/naver/logout',
        naverRefresh: '/auth/naver/refresh',
        health: '/health' // Added health endpoint for isAvailable test
      }
    };
    mockConfig = {
      naverClientId: 'test-naver-client-id',
      timeout: 10000,
      retryCount: 3
    };

    naverProvider = new NaverAuthProvider(mockConfig, mockHttpClient, mockApiConfig);
  });

  describe('validateToken', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: false,
        error: '토큰 검증을 위해 액세스 토큰이 필요합니다.',
        message: '액세스 토큰이 필요합니다.',
        data: null
      });

      const token: Token = {
        accessToken: '',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('액세스 토큰이 null이면 에러를 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: false,
        error: '토큰 검증을 위해 액세스 토큰이 필요합니다.',
        message: '액세스 토큰이 필요합니다.',
        data: null
      });

      const token: Token = {
        accessToken: null as any,
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
      }
    });

    it('Naver 토큰 검증이 실패하면 에러를 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Naver 토큰 검증에 실패했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Naver 토큰 검증에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않았으면 에러를 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: false,
        error: 'Naver 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Naver 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('토큰 검증이 성공하면 성공 응답을 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: true,
        message: 'Naver 토큰 검증이 성공했습니다.',
        data: true
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Naver 토큰 검증이 성공했습니다.');
        expect(result.data).toBe(true); // TokenValidationResponse는 boolean을 반환
      }
    });

    it('예외가 발생하면 에러 응답을 반환해야 한다', async () => {
      const { validateTokenByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(validateTokenByNaver).mockResolvedValue({
        success: false,
        error: '토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.',
        message: 'Naver 토큰 검증 중 오류가 발생했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await naverProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.');
        expect(result.message).toBe('Naver 토큰 검증 중 오류가 발생했습니다.');
      }
    });
  });

  describe('getUserInfo', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(getUserInfoByNaver).mockResolvedValue({
        success: false,
        error: '사용자 정보 조회를 위해 액세스 토큰이 필요합니다.',
        message: '액세스 토큰이 필요합니다.',
        data: null
      });

      const token: Token = { accessToken: '', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await naverProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('사용자 정보 조회를 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('토큰이 유효하지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(getUserInfoByNaver).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Naver 사용자 정보 조회에 실패했습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await naverProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Naver 사용자 정보 조회에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(getUserInfoByNaver).mockResolvedValue({
        success: false,
        error: 'Naver 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await naverProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Naver 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('정상 조회 시 사용자 정보를 반환해야 한다', async () => {
      const { getUserInfoByNaver } = await import('../../src/network/naverAuthApi');
      vi.mocked(getUserInfoByNaver).mockResolvedValue({
        success: true,
        message: 'Naver 사용자 정보 조회가 성공했습니다.',
        data: { id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'naver' }
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await naverProvider.getUserInfo(token);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Naver 사용자 정보 조회가 성공했습니다.');
        expect(result.data).toEqual({ id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'naver' });
      }
    });
  });

  describe('isAvailable', () => {
    it('헬스 체크가 성공하면 true를 반환해야 한다', async () => {
      const { checkNaverServiceAvailability } = await import('../../src/network/naverAuthApi');
      vi.mocked(checkNaverServiceAvailability).mockResolvedValue({
        success: true,
        message: 'Naver 서비스가 정상입니다.',
        data: true
      });

      const result = await naverProvider.isAvailable();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('헬스 체크가 실패하면 에러를 반환해야 한다', async () => {
      const { checkNaverServiceAvailability } = await import('../../src/network/naverAuthApi');
      vi.mocked(checkNaverServiceAvailability).mockResolvedValue({
        success: false,
        error: 'Naver 서비스가 사용 불가능합니다.',
        message: '서비스 점검 중입니다.',
        data: null
      });

      const result = await naverProvider.isAvailable();
      expect(result.success).toBe(false);
    });
  });

  describe('login', () => {
    it('OAuth 로그인 요청이 아니면 에러를 반환해야 한다', async () => {
      // Email 로그인 요청 형태로 테스트
      const invalidRequest = {
        email: 'test@example.com',
        password: 'password123'
      } as any;

      const result = await naverProvider.login(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NaverAuthProvider는 OAuth 로그인 요청만 지원합니다.');
        expect(result.message).toBe('OAuth 로그인 요청이 아닙니다.');
      }
    });

    it('authCode가 있는 OAuth 요청은 정상 처리해야 한다', async () => {
      const { loginByNaver } = await import('../../src/network');
      vi.mocked(loginByNaver).mockResolvedValue({
        success: true,
        message: 'Naver 로그인이 성공했습니다.',
        data: {
          token: {
            accessToken: 'naver-access-token',
            refreshToken: 'naver-refresh-token',
            expiredAt: Date.now() + 3600000
          },
          user: {
            id: 'naver-user-1',
            email: 'test@naver.com',
            nickname: 'Naver User',
            provider: 'naver'
          }
        }
      });

      const oauthRequest = {
        authCode: 'naver-auth-code-123',
        codeVerifier: 'code-verifier'
      };

      const result = await naverProvider.login(oauthRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Naver 로그인이 성공했습니다.');
        expect(result.data.user.provider).toBe('naver');
      }
    });
  });

  describe('logout', () => {
    it('로그아웃 요청을 정상 처리해야 한다', async () => {
      const { logoutByNaver } = await import('../../src/network');
      vi.mocked(logoutByNaver).mockResolvedValue({
        success: true,
        message: 'Naver 로그아웃이 성공했습니다.',
        data: null
      });

      const logoutRequest = {
        refreshToken: 'naver-refresh-token'
      };

      const result = await naverProvider.logout(logoutRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Naver 로그아웃이 성공했습니다.');
      }
    });
  });

  describe('refreshToken', () => {
    it('토큰 갱신 요청을 정상 처리해야 한다', async () => {
      const { refreshTokenByNaver } = await import('../../src/network');
      vi.mocked(refreshTokenByNaver).mockResolvedValue({
        success: true,
        message: 'Naver 토큰 갱신이 성공했습니다.',
        data: {
          accessToken: 'new-naver-access-token',
          refreshToken: 'new-naver-refresh-token',
          expiredAt: Date.now() + 3600000
        }
      });

      const refreshRequest = {
        refreshToken: 'naver-refresh-token'
      };

      const result = await naverProvider.refreshToken(refreshRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Naver 토큰 갱신이 성공했습니다.');
        expect(result.data.accessToken).toBe('new-naver-access-token');
      }
    });
  });
});
