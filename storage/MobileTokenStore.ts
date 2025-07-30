// 모바일 환경 저장소 (ex: SecureStore) 
// TODO: SecureStore 연동 예정
import { Token } from '../types';
import { TokenStore } from './TokenStore.interface';
// 실제 환경에서는 'expo-secure-store' 또는 유사 패키지를 import
// import * as SecureStore from 'expo-secure-store';

export const MobileTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      // await SecureStore.setItemAsync('accessToken', token.accessToken);
      // if (token.refreshToken) await SecureStore.setItemAsync('refreshToken', token.refreshToken);
      // if (token.expiresAt) await SecureStore.setItemAsync('expiresAt', token.expiresAt.toString());
      return true;
    } catch (e) {
      return false;
    }
  },
  async getToken(): Promise<Token | null> {
    // const accessToken = await SecureStore.getItemAsync('accessToken');
    // if (!accessToken) return null;
    // const refreshToken = await SecureStore.getItemAsync('refreshToken') || undefined;
    // const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
    // const expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;
    // return { accessToken, refreshToken, expiresAt };
    return null;
  },
  async removeToken(): Promise<boolean> {
    // 현재 사용자의 토큰만 제거 (로그아웃 시 사용)
    try {
      // await SecureStore.deleteItemAsync('accessToken');
      // await SecureStore.deleteItemAsync('refreshToken');
      // await SecureStore.deleteItemAsync('expiresAt');
      return true;
    } catch (e) {
      return false;
    }
  },
  async hasToken(): Promise<boolean> {
    // const accessToken = await SecureStore.getItemAsync('accessToken');
    // return accessToken !== null;
    return false;
  },
  async isTokenExpired(): Promise<boolean> {
    // const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
    // if (!expiresAtStr) return false;
    // const expiresAt = Number(expiresAtStr);
    // return Date.now() > expiresAt;
    return false;
  },
  async clear(): Promise<boolean> {
    // 모든 토큰 관련 데이터를 완전히 정리 (앱 초기화나 데이터 완전 삭제 시 사용)
    try {
      // await SecureStore.deleteItemAsync('accessToken');
      // await SecureStore.deleteItemAsync('refreshToken');
      // await SecureStore.deleteItemAsync('expiresAt');
      // 추가로 다른 토큰 관련 키들도 모두 삭제
      // await SecureStore.deleteItemAsync('userId');
      // await SecureStore.deleteItemAsync('userInfo');
      // await SecureStore.deleteItemAsync('lastLoginTime');
      return true;
    } catch (e) {
      return false;
    }
  },
}; 