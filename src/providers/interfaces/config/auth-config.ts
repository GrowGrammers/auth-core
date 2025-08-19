// 인증 제공자 설정 인터페이스
export interface AuthProviderConfig {
  // apiConfig는 외부에서 주입받으므로 여기서는 제거
  // 기타 설정만 유지
  timeout?: number;
  retryCount?: number;
} 