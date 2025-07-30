// 공통 타입 모음 
// types.ts

export interface Token {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number; // unix timestamp
  }
  
  // 추후 수정 가능능
  export interface UserInfo {
    id: string;
    email: string;
    name?: string;
    provider: 'email' | 'google'; // 또는 enum으로도 가능
  }
  