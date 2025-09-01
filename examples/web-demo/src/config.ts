// 환경별 설정 관리
export const config = {
  // 개발 환경 (MSW 사용)
  development: {
    apiBaseUrl: 'http://localhost:5173',
    httpClient: 'MSWHttpClient',
    description: 'MSW 모의 서버 사용'
  },
  
  // 모의 응답 테스트
  mock: {
    apiBaseUrl: 'http://localhost:5173',
    httpClient: 'MockHttpClient',
    description: 'MockHttpClient 모의 응답 사용'
  },
  
  // 로컬 백엔드 테스트
  localBackend: {
    apiBaseUrl: 'http://localhost:8080',
    httpClient: 'RealHttpClient',
    description: '로컬 백엔드 서버 사용'
  },
  
  // 스테이징 환경
  staging: {
    apiBaseUrl: 'https://staging-api.example.com',
    httpClient: 'RealHttpClient',
    description: '스테이징 백엔드 서버 사용'
  },
  
  // 프로덕션 환경
  production: {
    apiBaseUrl: 'https://api.example.com',
    httpClient: 'RealHttpClient',
    description: '프로덕션 백엔드 서버 사용'
  }
};

// 현재 환경 설정 (기본값: development)
export const currentConfig = config.localBackend;
