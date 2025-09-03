import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAuthProvider } from '../../src/providers/implementations/GoogleAuthProvider';
import { GoogleAuthProviderConfig } from '../../src/providers/interfaces/config/auth-config';
import { FakeHttpClient } from '../mocks/FakeHttpClient';
import { Token } from '../../src/shared/types';

// Google Auth API 모킹
vi.mock('../../src/network/googleAuthApi', () => ({
  validateTokenByGoogle: vi.fn(),
  getUserInfoByGoogle: vi.fn(),
  checkGoogleServiceAvailability: vi.fn()
}));

describe('GoogleAuthProvider', () => {
  let googleProvider: GoogleAuthProvider;
  let mockHttpClient: FakeHttpClient;
  let mockApiConfig: any;
  let mockConfig: GoogleAuthProviderConfig;

  beforeEach(() => {
    mockHttpClient = new FakeHttpClient();
    mockApiConfig = {
      apiBaseUrl: 'https://api.example.com',
      endpoints: {
        googleLogin: '/auth/google/login',
        googleLogout: '/auth/google/logout',
        googleRefresh: '/auth/google/refresh',
        health: '/health' // Added health endpoint for isAvailable test
      }
    };
    mockConfig = {
      googleClientId: 'test-google-client-id',
      timeout: 10000,
      retryCount: 3
    };

    googleProvider = new GoogleAuthProvider(mockConfig, mockHttpClient, mockApiConfig);
  });

  describe('validateToken', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
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

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('액세스 토큰이 null이면 에러를 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
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

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증을 위해 액세스 토큰이 필요합니다.');
      }
    });

    it('Google 토큰 검증이 실패하면 에러를 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Google 토큰 검증에 실패했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Google 토큰 검증에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않았으면 에러를 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: false,
        error: 'Google 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('토큰 검증이 성공하면 성공 응답을 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 토큰 검증이 성공했습니다.',
        data: true
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Google 토큰 검증이 성공했습니다.');
        expect(result.data).toBe(true); // TokenValidationResponse는 boolean을 반환
      }
    });

    it('예외가 발생하면 에러 응답을 반환해야 한다', async () => {
      const { validateTokenByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(validateTokenByGoogle).mockResolvedValue({
        success: false,
        error: '토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.',
        message: 'Google 토큰 검증 중 오류가 발생했습니다.',
        data: null
      });

      const token: Token = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiredAt: Date.now() + 3600000
      };

      const result = await googleProvider.validateToken(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('토큰 검증 과정에서 예상치 못한 오류가 발생했습니다.');
        expect(result.message).toBe('Google 토큰 검증 중 오류가 발생했습니다.');
      }
    });
  });

  describe('getUserInfo', () => {
    it('액세스 토큰이 없으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: false,
        error: '사용자 정보 조회를 위해 액세스 토큰이 필요합니다.',
        message: '액세스 토큰이 필요합니다.',
        data: null
      });

      const token: Token = { accessToken: '', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await googleProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('사용자 정보 조회를 위해 액세스 토큰이 필요합니다.');
        expect(result.message).toBe('액세스 토큰이 필요합니다.');
      }
    });

    it('토큰이 유효하지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: false,
        error: '제공된 토큰이 유효하지 않거나 만료되었습니다.',
        message: 'Google 사용자 정보 조회에 실패했습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await googleProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('제공된 토큰이 유효하지 않거나 만료되었습니다.');
        expect(result.message).toBe('Google 사용자 정보 조회에 실패했습니다.');
      }
    });

    it('이메일이 인증되지 않으면 에러를 반환해야 한다', async () => {
      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: false,
        error: 'Google 계정의 이메일 인증이 필요합니다.',
        message: '이메일이 인증되지 않았습니다.',
        data: null
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await googleProvider.getUserInfo(token);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Google 계정의 이메일 인증이 필요합니다.');
        expect(result.message).toBe('이메일이 인증되지 않았습니다.');
      }
    });

    it('정상 조회 시 사용자 정보를 반환해야 한다', async () => {
      const { getUserInfoByGoogle } = await import('../../src/network/googleAuthApi');
      vi.mocked(getUserInfoByGoogle).mockResolvedValue({
        success: true,
        message: 'Google 사용자 정보 조회가 성공했습니다.',
        data: { id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'google' }
      });
      const token: Token = { accessToken: 'x', refreshToken: 'r', expiredAt: Date.now() + 1000 };
      const result = await googleProvider.getUserInfo(token);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Google 사용자 정보 조회가 성공했습니다.');
        expect(result.data).toEqual({ id: 'u1', email: 'a@b.com', nickname: 'A', provider: 'google' });
      }
    });
  });

  describe('isAvailable', () => {
    it('헬스 체크가 성공하면 true를 반환해야 한다', async () => {
      const { checkGoogleServiceAvailability } = await import('../../src/network/googleAuthApi');
      vi.mocked(checkGoogleServiceAvailability).mockResolvedValue({
        success: true,
        message: 'Google 서비스가 정상입니다.',
        data: true
      });

      const result = await googleProvider.isAvailable();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('헬스 체크가 실패하면 에러를 반환해야 한다', async () => {
      const { checkGoogleServiceAvailability } = await import('../../src/network/googleAuthApi');
      vi.mocked(checkGoogleServiceAvailability).mockResolvedValue({
        success: false,
        error: 'Google 서비스가 사용 불가능합니다.',
        message: '서비스 점검 중입니다.',
        data: null
      });

      const result = await googleProvider.isAvailable();
      expect(result.success).toBe(false);
    });
  });
});
