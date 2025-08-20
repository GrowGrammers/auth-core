import { setupServer } from 'msw/node';
import { handlers } from './msw.handlers';

// MSW 서버 설정 - Node.js 환경에서 사용
export const server = setupServer(...handlers);

// 서버 시작
export function startMSWServer() {
  server.listen({ onUnhandledRequest: 'warn' });
}

// 서버 중지
export function stopMSWServer() {
  server.close();
  console.log('🛑 MSW 서버가 중지되었습니다.');
}
