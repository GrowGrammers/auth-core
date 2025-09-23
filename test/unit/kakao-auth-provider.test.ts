import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KakaoAuthProvider } from '../../src/providers/implementations/KakaoAuthProvider';
import { KakaoAuthProviderConfig } from '../../src/providers/interfaces/config/auth-config';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { Token } from '../../src/shared/types';

// Kakao Auth API 모킹
vi.mock('../../src/network/kakaoAuthApi', () => ({
  validateTokenByKakao: vi.fn(),
  getUserInfoByKakao: vi.fn(),
  checkKakaoServiceAvailability: vi.fn()
}));

// Network 모듈 모킹 (loginByKakao, logoutByKakao, refreshTokenByKakao가 여기서 export됨)
vi.mock('../../src/network', () => ({
  loginByKakao: vi.fn(),
  logoutByKakao: vi.fn(),
  refreshTokenByKakao: vi.fn()
}));

describe('KakaoAuthProvider', () => {
  let kakaoProvider: KakaoAuthProvider;
  let mockHttpClient: FakeHttpClient;
  let mockApiConfig: any;
  let mockConfig: KakaoAuthProviderConfig;

  beforeEach(() => {
    mockHttpClient = new FakeHttpClient();
    mockApiConfig = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        kakaoLogin: '/auth/kakao/login',
        kakaoLogout: '/auth/kakao/logout',
        kakaoRefresh: '/auth/kakao/refresh',
        health: '/health' // Added health endpoint for isAvailable test
      }
    };
    mockConfig = {
      kakaoClientId: 'test-kakao-client-id',
      timeout: 10000,
      retryCount: 3
    };

    kakaoProvider = new KakaoAuthProvider(mockConfig, mockHttpClient, mockApiConfig);
  });

  describe('validateToken', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
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

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('액세스 토큰이 null이면 에러를 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
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

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
      }
    });

    it('Kakao 토큰 검증이 실패하면 에러를 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Kakao 토큰 검증에 실패했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Kakao 토큰 검증에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않았으면 에러를 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
        success: false,
        error: 'Kakao 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Kakao 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('토큰 검증이 성공하면 성공 응답을 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
        success: true,
        message: 'Kakao 토큰 검증이 성공했습니다.',
        data: true
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Kakao 토큰 검증이 성공했습니다.');
        expect(result.data).toBe(true); // TokenValidationResponse는 boolean을 반환
      }
    });

    it('예외가 발생하면 에러 응답을 반환해야 한다', async () => {
      const { validateTokenByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(validateTokenByKakao).mockResolvedValue({
        success: false,
        error: '토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.',
        message: 'Kakao 토큰 검증 중 오류가 발생했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await kakaoProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.');
        expect(result.message).toBe('Kakao 토큰 검증 중 오류가 발생했습니다.');
      }
    });
  });

  describe('getUserInfo', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(getUserInfoByKakao).mockResolvedValue({
        success: false,
        error: '사용자 정보 조회를 위해 액세스 토큰이 필요합니다.',
        message: '액세스 토큰이 필요합니다.',
        data: null
      });

      const token: Token = { accessToken: '', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await kakaoProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('사용자 정보 조회를 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('토큰이 유효하지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(getUserInfoByKakao).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Kakao 사용자 정보 조회에 실패했습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await kakaoProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Kakao 사용자 정보 조회에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(getUserInfoByKakao).mockResolvedValue({
        success: false,
        error: 'Kakao 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await kakaoProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Kakao 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('정상 조회 시 사용자 정보를 반환해야 한다', async () => {
      const { getUserInfoByKakao } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(getUserInfoByKakao).mockResolvedValue({
        success: true,
        message: 'Kakao 사용자 정보 조회가 성공했습니다.',
        data: { id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'kakao' }
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await kakaoProvider.getUserInfo(token);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Kakao 사용자 정보 조회가 성공했습니다.');
        expect(result.data).toEqual({ id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'kakao' });
      }
    });
  });

  describe('isAvailable', () => {
    it('헬스 체크가 성공하면 true를 반환해야 한다', async () => {
      const { checkKakaoServiceAvailability } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(checkKakaoServiceAvailability).mockResolvedValue({
        success: true,
        message: 'Kakao 서비스가 정상입니다.',
        data: true
      });

      const result = await kakaoProvider.isAvailable();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('헬스 체크가 실패하면 에러를 반환해야 한다', async () => {
      const { checkKakaoServiceAvailability } = await import('../../src/network/kakaoAuthApi');
      vi.mocked(checkKakaoServiceAvailability).mockResolvedValue({
        success: false,
        error: 'Kakao 서비스가 사용 불가능합니다.',
        message: '서비스 점검 중입니다.',
        data: null
      });

      const result = await kakaoProvider.isAvailable();
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

      const result = await kakaoProvider.login(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('KakaoAuthProvider는 OAuth 로그인 요청만 지원합니다.');
        expect(result.message).toBe('OAuth 로그인 요청이 아닙니다.');
      }
    });

    it('authCode가 있는 OAuth 요청은 정상 처리해야 한다', async () => {
      const { loginByKakao } = await import('../../src/network');
      vi.mocked(loginByKakao).mockResolvedValue({
        success: true,
        message: 'Kakao 로그인이 성공했습니다.',
        data: {
          token: {
            accessToken: 'kakao-access-token',
            refreshToken: 'kakao-refresh-token',
            expiredAt: Date.now() + 3600000
          },
          user: {
            id: 'kakao-user-1',
            email: 'test@kakao.com',
            nickname: 'Kakao User',
            provider: 'kakao'
          }
        }
      });

      const oauthRequest = {
        authCode: 'kakao-auth-code-123',
        codeVerifier: 'code-verifier'
      };

      const result = await kakaoProvider.login(oauthRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Kakao 로그인이 성공했습니다.');
        expect(result.data.user.provider).toBe('kakao');
      }
    });
  });

  describe('logout', () => {
    it('로그아웃 요청을 정상 처리해야 한다', async () => {
      const { logoutByKakao } = await import('../../src/network');
      vi.mocked(logoutByKakao).mockResolvedValue({
        success: true,
        message: 'Kakao 로그아웃이 성공했습니다.',
        data: null
      });

      const logoutRequest = {
        refreshToken: 'kakao-refresh-token'
      };

      const result = await kakaoProvider.logout(logoutRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Kakao 로그아웃이 성공했습니다.');
      }
    });
  });

  describe('refreshToken', () => {
    it('토큰 갱신 요청을 정상 처리해야 한다', async () => {
      const { refreshTokenByKakao } = await import('../../src/network');
      vi.mocked(refreshTokenByKakao).mockResolvedValue({
        success: true,
        message: 'Kakao 토큰 갱신이 성공했습니다.',
        data: {
          accessToken: 'new-kakao-access-token',
          refreshToken: 'new-kakao-refresh-token',
          expiredAt: Date.now() + 3600000
        }
      });

      const refreshRequest = {
        refreshToken: 'kakao-refresh-token'
      };

      const result = await kakaoProvider.refreshToken(refreshRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Kakao 토큰 갱신이 성공했습니다.');
        expect(result.data.accessToken).toBe('new-kakao-access-token');
      }
    });
  });
});
