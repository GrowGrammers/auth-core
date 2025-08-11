// 테스트용 가짜 저장소
// 테스트 전용 - 절대 프로덕션 환경에 사용하지 마세요
import { Token } from '../shared/types';
import { TokenStore } from './TokenStore.interface';

let memoryToken: Token | null = null;

export const FakeTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    memoryToken = { ...token };
    return true;
  },
  async getToken(): Promise<Token | null> {
    return memoryToken ? { ...memoryToken } : null;
  },
  async removeToken(): Promise<boolean> {
    // 현재 사용자의 토큰만 제거 (로그아웃 시 사용)
    memoryToken = null;
    return true;
  },
  async hasToken(): Promise<boolean> {
    return memoryToken !== null;
  },
  async isTokenExpired(): Promise<boolean> {
    if (!memoryToken || !memoryToken.expiresAt) return false;
    return Date.now() > memoryToken.expiresAt;
  },
  async clear(): Promise<boolean> {
    // 모든 토큰 관련 데이터를 완전히 정리 (앱 초기화나 데이터 완전 삭제 시 사용)
    memoryToken = null;
    return true;
  },
}; 