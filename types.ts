// 공통 타입 모음 
// types.ts

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
    name?: string;
    provider: AuthProviderType;
    // 추가 사용자 정보 필요시 확장
  }
  