import { TokenStore, SaveTokenResponse, GetTokenResponse, RemoveTokenResponse, HasTokenResponse, IsTokenExpiredResponse, ClearResponse } from '../../storage/TokenStore.interface';
import { Token } from '../../shared/types';
import { createSuccessResponse, createErrorResponse } from '../../shared/utils';

export class InMemoryTokenStore implements TokenStore {
  private tokens: Token | null = null;
  private isExpired = false;

  async saveToken(token: Token): Promise<SaveTokenResponse> {
    try {
      this.tokens = { ...token };
      this.isExpired = false;
      return createSuccessResponse('토큰 저장 성공', undefined);
    } catch (error) {
      return createErrorResponse('토큰 저장 실패');
    }
  }

  async getToken(): Promise<GetTokenResponse> {
    try {
      if (!this.tokens) {
        return createSuccessResponse('토큰 없음', null);
      }
      return createSuccessResponse('토큰 조회 성공', { ...this.tokens });
    } catch (error) {
      return createErrorResponse('토큰 조회 실패');
    }
  }

  async removeToken(): Promise<RemoveTokenResponse> {
    try {
      this.tokens = null;
      this.isExpired = false;
      return createSuccessResponse('토큰 삭제 성공', undefined);
    } catch (error) {
      return createErrorResponse('토큰 삭제 실패');
    }
  }

  async hasToken(): Promise<HasTokenResponse> {
    try {
      const hasToken = this.tokens !== null && !this.isExpired;
      return createSuccessResponse('토큰 존재 여부 확인 성공', hasToken);
    } catch (error) {
      return createErrorResponse('토큰 존재 여부 확인 실패');
    }
  }

  async isTokenExpired(): Promise<IsTokenExpiredResponse> {
    try {
      if (!this.tokens) {
        return createSuccessResponse('토큰 만료 여부 확인 성공', true);
      }
      return createSuccessResponse('토큰 만료 여부 확인 성공', this.isExpired);
    } catch (error) {
      return createErrorResponse('토큰 만료 여부 확인 실패');
    }
  }

  async clear(): Promise<ClearResponse> {
    try {
      this.tokens = null;
      this.isExpired = false;
      return createSuccessResponse('저장소 초기화 성공', undefined);
    } catch (error) {
      return createErrorResponse('저장소 초기화 실패');
    }
  }

  // 테스트 헬퍼 메서드들
  setExpired(expired: boolean) {
    this.isExpired = expired;
  }

  getCurrentToken() {
    return this.tokens;
  }

  reset() {
    this.tokens = null;
    this.isExpired = false;
  }
}
