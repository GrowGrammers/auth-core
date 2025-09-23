// 저장 전략 인터페이스 
import { Token, SuccessResponse, ErrorResponse } from '../shared/types';

// TokenStore 응답 타입들
export type TokenStoreResponse<T> = SuccessResponse<T> | ErrorResponse;

// 구체적인 응답 타입들
export type SaveTokenResponse = TokenStoreResponse<void>;
export type GetTokenResponse = TokenStoreResponse<Token | null>;
export type RemoveTokenResponse = TokenStoreResponse<void>;
export type HasTokenResponse = TokenStoreResponse<boolean>;
export type IsTokenExpiredResponse = TokenStoreResponse<boolean>;
export type ClearResponse = TokenStoreResponse<void>;

export interface TokenStore {
  /**
   * 토큰을 저장합니다.
   * @param token 저장할 토큰 객체
   * @returns 저장 결과
   */
  saveToken(token: Token): Promise<SaveTokenResponse>;

  /**
   * 저장된 토큰을 가져옵니다.
   * @returns 저장된 토큰 또는 에러 응답
   */
  getToken(): Promise<GetTokenResponse>;

  /**
   * 저장된 토큰을 삭제합니다.
   * @returns 삭제 결과
   */
  removeToken(): Promise<RemoveTokenResponse>;

  /**
   * 토큰이 존재하는지 확인합니다.
   * @returns 토큰 존재 여부 또는 에러 응답
   */
  hasToken(): Promise<HasTokenResponse>;

  /**
   * 토큰이 만료되었는지 확인합니다.
   * @returns 만료 여부 또는 에러 응답
   */
  isTokenExpired(): Promise<IsTokenExpiredResponse>;

  /**
   * 저장소를 초기화합니다.
   * @returns 초기화 결과
   */
  clear(): Promise<ClearResponse>;
} 