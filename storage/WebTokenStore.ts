// 웹 환경 저장소 (ex: localStorage) 
import { Token } from '../types';
import { TokenStore } from './TokenStore.interface';

export const WebTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      localStorage.setItem('accessToken', token.accessToken);
      if (token.refreshToken) {
        localStorage.setItem('refreshToken', token.refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
      if (token.expiresAt) {
        localStorage.setItem('expiresAt', token.expiresAt.toString());
      } else {
        localStorage.removeItem('expiresAt');
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  async getToken(): Promise<Token | null> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;
    const refreshToken = localStorage.getItem('refreshToken') || undefined;
    const expiresAtStr = localStorage.getItem('expiresAt');
    const expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;
    return { accessToken, refreshToken, expiresAt };
  },

  async removeToken(): Promise<boolean> {
    // 현재 사용자의 토큰만 제거 (로그아웃 시 사용)
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      return true;
    } catch (e) {
      return false;
    }
  },

  async hasToken(): Promise<boolean> {
    return localStorage.getItem('accessToken') !== null;
  },

  async isTokenExpired(): Promise<boolean> {
    const expiresAtStr = localStorage.getItem('expiresAt');
    if (!expiresAtStr) return false;
    const expiresAt = Number(expiresAtStr);
    return Date.now() > expiresAt;
  },

  async clear(): Promise<boolean> {
    // 모든 토큰 관련 데이터를 완전히 정리 (앱 초기화나 데이터 완전 삭제 시 사용)
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      // 추가로 다른 토큰 관련 키들도 모두 삭제
      localStorage.removeItem('userId');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('lastLoginTime');
      localStorage.removeItem('authProvider');
      return true;
    } catch (e) {
      return false;
    }
  },
};
  