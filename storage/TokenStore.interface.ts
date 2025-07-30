// 저장 전략 인터페이스 
import { Token } from '../types';

export interface TokenStore {
  /**
   * 토큰을 저장합니다.
   * @param token 저장할 토큰 객체
   * @returns 저장 성공 여부
   */
  saveToken(token: Token): Promise<boolean>;

  /**
   * 저장된 토큰을 가져옵니다.
   * @returns 저장된 토큰 또는 null
   */
  getToken(): Promise<Token | null>;

  /**
   * 저장된 토큰을 삭제합니다.
   * @returns 삭제 성공 여부
   */
  removeToken(): Promise<boolean>;

  /**
   * 토큰이 존재하는지 확인합니다.
   * @returns 토큰 존재 여부
   */
  hasToken(): Promise<boolean>;

  /**
   * 토큰이 만료되었는지 확인합니다.
   * @returns 만료 여부
   */
  isTokenExpired(): Promise<boolean>;

  /**
   * 저장소를 초기화합니다.
   * @returns 초기화 성공 여부
   */
  clear(): Promise<boolean>;
} 