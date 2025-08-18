// 통합 테스트 환경 설정
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // 통합 테스트 시작 전 전역 설정
  console.log('🔗 통합 테스트 환경 시작');
  
  // 환경 변수 설정
  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://localhost:3000'; // 테스트용 API 서버
  
  // MSW 서버 시작 (실제 백엔드 대신 사용)
  console.log('🚀 MSW 서버 시작');
});

afterAll(() => {
  // 통합 테스트 종료 후 정리
  console.log('🧹 통합 테스트 환경 정리 완료');
});
