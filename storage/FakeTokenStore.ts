// 테스트용 가짜 저장소
// 테스트 전용 - 절대 프로덕션 환경에 사용하지 마세요
import { Token } from '../shared/types';
import { TokenStore, SaveTokenResponse, GetTokenResponse, RemoveTokenResponse, HasTokenResponse, IsTokenExpiredResponse, ClearResponse } from './TokenStore.interface';
import { 
  createTokenSaveErrorResponse, 
  createTokenReadErrorResponse, 
  createTokenDeleteErrorResponse, 
  createStorageClearErrorResponse
} from '../shared/utils/errorUtils';
import { createStorageSuccessResponse } from './index';

let memoryToken: Token | null = null;

export const FakeTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<SaveTokenResponse> {
    try {
      if (!token || !token.accessToken) {
        return createTokenSaveErrorResponse('유효하지 않은 토큰입니다.');
      }

      memoryToken = { ...token };
      return createStorageSuccessResponse('토큰이 성공적으로 저장되었습니다.', undefined);
    } catch (error) {
      console.error('토큰 저장 중 오류 발생:', error);
      return createTokenSaveErrorResponse('토큰 저장 중 오류가 발생했습니다.');
    }
  },

  async getToken(): Promise<GetTokenResponse> {
    try {
      if (!memoryToken) {
        return createStorageSuccessResponse('저장된 토큰이 없습니다.', null);
      }

      return createStorageSuccessResponse('토큰을 성공적으로 가져왔습니다.', { ...memoryToken });
    } catch (error) {
      console.error('토큰 읽기 중 오류 발생:', error);
      return createTokenReadErrorResponse('토큰 읽기 중 오류가 발생했습니다.');
    }
  },

  async removeToken(): Promise<RemoveTokenResponse> {
    try {
      // 현재 사용자의 토큰만 제거 (로그아웃 시 사용)
      memoryToken = null;
      return createStorageSuccessResponse('토큰이 성공적으로 삭제되었습니다.', undefined);
    } catch (error) {
      console.error('토큰 삭제 중 오류 발생:', error);
      return createTokenDeleteErrorResponse('토큰 삭제 중 오류가 발생했습니다.');
    }
  },

  async hasToken(): Promise<HasTokenResponse> {
    try {
      const hasToken = memoryToken !== null;
      return createStorageSuccessResponse(
        hasToken ? '토큰이 존재합니다.' : '토큰이 존재하지 않습니다.',
        hasToken
      );
    } catch (error) {
      console.error('토큰 존재 확인 중 오류 발생:', error);
      return createTokenReadErrorResponse('토큰 존재 확인 중 오류가 발생했습니다.');
    }
  },

  async isTokenExpired(): Promise<IsTokenExpiredResponse> {
    try {
      if (!memoryToken || !memoryToken.expiresAt) {
        return createStorageSuccessResponse('토큰 만료 시간이 설정되지 않았습니다.', false);
      }

      const isExpired = Date.now() > memoryToken.expiresAt;
      return createStorageSuccessResponse(
        isExpired ? '토큰이 만료되었습니다.' : '토큰이 유효합니다.',
        isExpired
      );
    } catch (error) {
      console.error('토큰 만료 확인 중 오류 발생:', error);
      return createTokenReadErrorResponse('토큰 만료 확인 중 오류가 발생했습니다.');
    }
  },

  async clear(): Promise<ClearResponse> {
    try {
      // 모든 토큰 관련 데이터를 완전히 정리 (앱 초기화나 데이터 완전 삭제 시 사용)
      memoryToken = null;
      return createStorageSuccessResponse('저장소가 성공적으로 초기화되었습니다.', undefined);
    } catch (error) {
      console.error('저장소 초기화 중 오류 발생:', error);
      return createStorageClearErrorResponse('저장소 초기화 중 오류가 발생했습니다.');
    }
  }
}; 