import { setupWorker } from 'msw/browser';
import { handlers } from '../../../../test/setup/msw.handlers';

// MSW 워커 설정 및 시작 (브라우저용)
// 
// test/setup/msw.server.ts는 Node.js용, 이건 브라우저용
// 공통 핸들러는 test/setup/msw.handlers.ts에서 재사용
export async function setupMSWWorker() {
  const worker = setupWorker(...handlers);
  
  try {
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    
    console.log('🚀 MSW 워커가 시작되었습니다. (브라우저용)');
    console.log('📡 모킹된 API 엔드포인트:');
    console.log('   - POST /api/v1/auth/email/request');
    console.log('   - POST /api/v1/auth/email/verify');
    console.log('   - POST /api/v1/auth/members/email-login');
    console.log('   - GET  /api/v1/auth/validate-token');
    console.log('   - GET  /api/v1/auth/user-info');
    console.log('   - POST /api/v1/auth/members/refresh');
    console.log('   - POST /api/v1/auth/members/logout');
    console.log('   - GET  /api/v1/health');
    console.log('');
    return worker;
  } catch (error) {
    console.error('MSW 워커 시작 실패:', error);
    throw error;
  }
}
