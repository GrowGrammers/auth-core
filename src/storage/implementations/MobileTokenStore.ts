import { 
  TokenStore, 
  SaveTokenResponse, 
  GetTokenResponse, 
  RemoveTokenResponse, 
  HasTokenResponse, 
  IsTokenExpiredResponse, 
  ClearResponse 
} from '../TokenStore.interface';
import { Token } from '../../shared/types';

/**
 * 모바일 환경용 TokenStore 구현체 (AsyncStorage 사용)
 * React Native 환경에서 사용
 * 
 * 사용법:
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const tokenStore = new MobileTokenStore(AsyncStorage);
 */
export class MobileTokenStore implements TokenStore {
  private readonly STORAGE_KEY = 'auth_core_tokens';
  private storage: any; // AsyncStorage 또는 유사한 저장소

  constructor(storage: any) {
    this.storage = storage;
  }

  async saveToken(token: Token): Promise<SaveTokenResponse> {
    try {
      await this.storage.setItem(this.STORAGE_KEY, JSON.stringify(token));
      return { success: true, message: '토큰이 성공적으로 저장되었습니다.', data: undefined };
    } catch (error) {
      return { success: false, message: '토큰 저장에 실패했습니다.', data: null, error: '토큰 저장에 실패했습니다.' };
    }
  }

  async getToken(): Promise<GetTokenResponse> {
    try {
      const stored = await this.storage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: null };
      }
      
      const token = JSON.parse(stored);
      return { success: true, message: '토큰을 성공적으로 가져왔습니다.', data: token };
    } catch (error) {
      return { success: false, message: '토큰 조회에 실패했습니다.', data: null, error: '토큰 조회에 실패했습니다.' };
    }
  }

  async removeToken(): Promise<RemoveTokenResponse> {
    try {
      await this.storage.removeItem(this.STORAGE_KEY);
      return { success: true, message: '토큰이 성공적으로 삭제되었습니다.', data: undefined };
    } catch (error) {
      return { success: false, message: '토큰 삭제에 실패했습니다.', data: null, error: '토큰 삭제에 실패했습니다.' };
    }
  }

  async hasToken(): Promise<HasTokenResponse> {
    try {
      const stored = await this.storage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: false };
      }
      
      const token = JSON.parse(stored);
      const hasToken = !!(token.accessToken && token.refreshToken);
      return { success: true, message: '토큰 존재 여부를 확인했습니다.', data: hasToken };
    } catch (error) {
      return { success: false, message: '토큰 존재 확인에 실패했습니다.', data: null, error: '토큰 존재 확인에 실패했습니다.' };
    }
  }

  async isTokenExpired(): Promise<IsTokenExpiredResponse> {
    try {
      const stored = await this.storage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { success: true, message: '토큰이 없습니다.', data: true };
      }
      
      const token = JSON.parse(stored);
      // 간단한 만료 체크 (실제로는 JWT 디코딩 필요)
      const isExpired = !token.accessToken || !token.refreshToken;
      return { success: true, message: '토큰 만료 여부를 확인했습니다.', data: isExpired };
    } catch (error) {
      return { success: false, message: '토큰 만료 확인에 실패했습니다.', data: null, error: '토큰 만료 확인에 실패했습니다.' };
    }
  }

  async clear(): Promise<ClearResponse> {
    try {
      await this.storage.removeItem(this.STORAGE_KEY);
      return { success: true, message: '저장소가 성공적으로 초기화되었습니다.', data: undefined };
    } catch (error) {
      return { success: false, message: '저장소 초기화에 실패했습니다.', data: null, error: '저장소 초기화에 실패했습니다.' };
    }
  }
}
