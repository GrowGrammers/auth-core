import { setupServer } from 'msw/node';
import { handlers } from './msw.handlers';

// MSW 서버 설정 - Node.js 환경에서 사용
export const server = setupServer(...handlers);

// 서버 시작
export function startMSWServer() {
  server.listen({ onUnhandledRequest: 'warn' });
  console.log('🚀 MSW 서버가 시작되었습니다.');
  console.log('📡 모킹된 API 엔드포인트:');
  console.log('   - POST /api/auth/email/request-verification');
  console.log('   - POST /api/auth/email/login');
  console.log('   - GET  /api/auth/validate-token');
  console.log('   - GET  /api/auth/user-info');
  console.log('   - POST /api/auth/email/refresh');
  console.log('   - POST /api/auth/email/logout');
  console.log('   - GET  /api/health');
  console.log('');
}

// 서버 중지
export function stopMSWServer() {
  server.close();
  console.log('🛑 MSW 서버가 중지되었습니다.');
}
