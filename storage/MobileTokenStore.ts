// 모바일 환경 저장소 (ex: SecureStore) 
// TODO: SecureStore 연동 예정
import { Token } from '../types';
import { TokenStore } from './TokenStore.interface';

// 실제 환경에서는 'expo-secure-store' 또는 유사 패키지를 import
// import * as SecureStore from 'expo-secure-store';

export const MobileTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      // TODO: SecureStore 구현
      // await SecureStore.setItemAsync('accessToken', token.accessToken);
      // if (token.refreshToken) await SecureStore.setItemAsync('refreshToken', token.refreshToken);
      // if (token.expiresAt) await SecureStore.setItemAsync('expiresAt', token.expiresAt.toString());
      console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
      return true;
    } catch (e) {
      return false;
    }
  },

  async getToken(): Promise<Token | null> {
    // TODO: SecureStore 구현
    // const accessToken = await SecureStore.getItemAsync('accessToken');
    // if (!accessToken) return null;
    // const refreshToken = await SecureStore.getItemAsync('refreshToken') || undefined;
    // const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
    // const expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;
    // return { accessToken, refreshToken, expiresAt };
    console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
    return null;
  },

  async removeToken(): Promise<boolean> {
    try {
      // TODO: SecureStore 구현
      // await SecureStore.deleteItemAsync('accessToken');
      // await SecureStore.deleteItemAsync('refreshToken');
      // await SecureStore.deleteItemAsync('expiresAt');
      console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
      return true;
    } catch (e) {
      return false;
    }
  },

  async hasToken(): Promise<boolean> {
    // TODO: SecureStore 구현
    // const accessToken = await SecureStore.getItemAsync('accessToken');
    // return accessToken !== null;
    console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
    return false;
  },

  async isTokenExpired(): Promise<boolean> {
    // TODO: SecureStore 구현
    // const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
    // if (!expiresAtStr) return false;
    // const expiresAt = Number(expiresAtStr);
    // return Date.now() > expiresAt;
    console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
    return false;
  },

  async clear(): Promise<boolean> {
    try {
      // TODO: SecureStore 구현
      // await SecureStore.deleteItemAsync('accessToken');
      // await SecureStore.deleteItemAsync('refreshToken');
      // await SecureStore.deleteItemAsync('expiresAt');
      // 추가로 다른 토큰 관련 키들도 모두 삭제
      // await SecureStore.deleteItemAsync('userId');
      // await SecureStore.deleteItemAsync('userInfo');
      // await SecureStore.deleteItemAsync('lastLoginTime');
      console.warn('MobileTokenStore: SecureStore가 구현되지 않았습니다.');
      return true;
    } catch (e) {
      return false;
    }
  },
}; 