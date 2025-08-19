// 테스트 환경 설정
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // 테스트 시작 전 전역 설정
  console.log('🧪 테스트 환경 시작');
});

afterAll(() => {
  // 테스트 종료 후 정리
  console.log('🧹 테스트 환경 정리 완료');
});
