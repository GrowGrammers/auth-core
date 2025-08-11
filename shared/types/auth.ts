// 인증 관련 타입 정의
// shared/types/auth.ts

// 기본 토큰 인터페이스
export interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // unix timestamp
}

// 인증 제공자 타입
export type AuthProviderType = 'email' | 'google';

// 사용자 정보 인터페이스
export interface UserInfo {
  id: string;
  email: string;
  nickname?: string;
  provider: AuthProviderType;
  // 추가 사용자 정보 필요시 확장
}
