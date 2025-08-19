#!/usr/bin/env node

import { config } from 'dotenv';
import { AuthManager } from '../src/AuthManager';
import { EmailAuthProvider } from '../src/providers/implementations/EmailAuthProvider';
import { FakeTokenStore } from '../src/storage/FakeTokenStore';
import { ApiConfig } from '../src/shared/types';
import { FakeHttpClient } from '../test/mocks/FakeHttpClient';
import { MockHttpClient } from './mock-http-client';
import { RealHttpClient } from './http-client';
import { runIntegrationTests } from '../test/integration/auth-integration-tests';
import { startMSWServer, stopMSWServer } from '../test/setup/msw.server';

// 환경변수 로드
config();

async function main() {
  console.log('🚀 Auth Core 통합테스트 CLI 드라이버 시작');
  console.log('=====================================\n');

  // 환경변수에서 백엔드 설정 가져오기
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const testMode = process.env.TEST_MODE || 'local'; // 'local' | 'deployed' | 'msw'
  
  console.log(`📡 백엔드 URL: ${backendUrl}`);
  console.log(`🔧 테스트 모드: ${testMode}`);
  console.log('');

  // MSW 모드인 경우 MSW 서버 시작
  if (testMode === 'msw') {
    startMSWServer();
  }

  try {
    // API 설정 구성
    const apiConfig: ApiConfig = {
      apiBaseUrl: backendUrl,
      endpoints: {
        requestVerification: '/api/auth/email/request-verification',
        login: '/api/auth/email/login',
        logout: '/api/auth/email/logout',
        refresh: '/api/auth/email/refresh',
        validate: '/api/auth/validate-token',
        me: '/api/auth/user-info',
        health: '/api/health'
      },
      timeout: 10000,
      retryCount: 3
    };

    // HTTP 클라이언트 생성
    // - MSW 모드: MockHttpClient (백엔드 없이 모킹)
    // - Local/Deployed 모드: RealHttpClient (실제 백엔드와 통신)
    const httpClient = testMode === 'msw' ? new MockHttpClient() : new RealHttpClient();

    
    // 토큰 저장소 생성
    const tokenStore = FakeTokenStore;
    
    // 이메일 인증 제공자 생성
    const emailProvider = new EmailAuthProvider({ timeout: 10000, retryCount: 3 }, httpClient, apiConfig);
    
    // AuthManager 생성
    const authManager = new AuthManager({
      provider: emailProvider,
      apiConfig,
      httpClient,
      tokenStore
    });

    console.log('✅ AuthManager 초기화 완료');
    console.log('');

    // 통합테스트 실행
    await runIntegrationTests(authManager, apiConfig, testMode);

  } catch (error) {
    console.error('❌ 통합테스트 실행 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // MSW 모드인 경우 MSW 서버 중지
    if (testMode === 'msw') {
      stopMSWServer();
    }
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 치명적 오류:', error);
    process.exit(1);
  });
}

export { main };
