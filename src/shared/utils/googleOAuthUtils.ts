// Google OAuth 토큰 검증 유틸리티
import { OAuth2Client } from 'google-auth-library';

/**
 * Google OAuth ID 토큰을 검증합니다.
 * @param idToken Google OAuth ID 토큰
 * @param clientId Google OAuth 클라이언트 ID
 * @returns 검증된 토큰 정보 또는 null
 */
export async function verifyGoogleIdToken(
  idToken: string, 
  clientId: string
): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  exp: number;
} | null> {
  try {
    const client = new OAuth2Client(clientId);
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }
    
    // 토큰 만료 시간 확인
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return null;
    }
    
    return {
      sub: payload.sub || '',
      email: payload.email || '',
      email_verified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture,
      exp: payload.exp || 0
    };
  } catch (error) {
    console.error('Google ID 토큰 검증 실패:', error);
    return null;
  }
}

/**
 * Google 액세스 토큰을 검증합니다.
 * @param accessToken Google OAuth 액세스 토큰
 * @param clientId Google OAuth 클라이언트 ID
 * @returns 검증된 토큰 정보 또는 null
 */
export async function verifyGoogleAccessToken(
  accessToken: string,
  clientId: string
): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
} | null> {
  try {
    const client = new OAuth2Client(clientId);
    
    // 액세스 토큰으로 사용자 정보 조회
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    
    if (!userInfoResponse.ok) {
      return null;
    }
    
    const userInfo = await userInfoResponse.json();
    
    return {
      sub: userInfo.id || '',
      email: userInfo.email || '',
      email_verified: userInfo.verified_email || false,
      name: userInfo.name,
      picture: userInfo.picture
    };
  } catch (error) {
    console.error('Google 액세스 토큰 검증 실패:', error);
    return null;
  }
}
