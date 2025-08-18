import { AuthManager } from '../../src/AuthManager';

/**
 * 테스트용 공통 헬퍼 함수들
 */

/**
 * AuthManager의 인증 상태를 초기화합니다.
 */
export async function clearAuthState(authManager: AuthManager): Promise<void> {
  try {
    await authManager.logout({ provider: 'email' as const });
  } catch (error) {
    // 이미 로그아웃 상태인 경우 무시
  }
}

/**
 * 테스트용 지연 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 테스트용 랜덤 이메일 생성
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * 테스트용 랜덤 문자열 생성
 */
export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * 테스트 결과를 포맷팅하는 함수
 */
export function formatTestResult(testName: string, success: boolean, duration: number, error?: string): string {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const durationStr = `${duration}ms`;
  
  let result = `${status} ${testName} (${durationStr})`;
  
  if (!success && error) {
    result += `\n   Error: ${error}`;
  }
  
  return result;
}
