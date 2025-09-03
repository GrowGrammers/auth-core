import { AuthManager } from '../../src/AuthManager';
import { ApiConfig } from '../../src/shared/types';
import { 
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest
} from '../../src/providers/interfaces/dtos/auth.dto';
import { HttpClient } from '../../src/network/interfaces/HttpClient';

// =====================================
// 🧪 테스트 전용 인터페이스 (auth-core와 무관)
// =====================================
// 이 인터페이스는 통합테스트 결과를 요약하기 위한 용도로만 사용됩니다.
// auth-core의 실제 타입이나 응답 구조와는 전혀 관련이 없습니다.
export interface TestResult {
  testName: string;        // 테스트 시나리오 이름
  success: boolean;        // 테스트 성공/실패 여부
  error?: string;          // 실패 시 에러 메시지
  duration: number;        // 테스트 소요 시간
  details?: any;           // auth-core 응답 데이터를 그대로 담음 (참고용)
}

export async function runGoogleIntegrationTests(
  authManager: AuthManager, 
  apiConfig: ApiConfig, 
  testMode: string
): Promise<void> {
  console.log('Auth Core Google OAuth 통합테스트 시작');
  console.log('=====================================\n');

  const testResults: TestResult[] = [];
  const startTime = Date.now();

  try {
    // 시나리오 1: Google OAuth 로그인 플로우 테스트
    console.log('[1/3] Google OAuth 로그인 플로우 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const loginFlowResult = await testGoogleOAuthLoginFlow(authManager);
    testResults.push(loginFlowResult);

    // 시나리오 2: Google OAuth 토큰 관리 테스트
    console.log('[2/3] Google OAuth 토큰 관리 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const tokenManagementResult = await testGoogleOAuthTokenManagement(authManager);
    testResults.push(tokenManagementResult);

    // 시나리오 3: Google OAuth 에러 처리 테스트
    console.log('[3/3] Google OAuth 에러 처리 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const errorHandlingResult = await testGoogleOAuthErrorHandling(authManager);
    testResults.push(errorHandlingResult);

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
  }

  await printTestSummary(testResults, startTime);
}

// =====================================
// 🧪 테스트 시나리오 함수들 (auth-core와 무관)
// =====================================
// 이 함수들은 auth-core의 실제 인증 흐름을 테스트하기 위한 시나리오입니다.
// auth-core의 실제 메서드들을 호출하여 올바르게 동작하는지 검증합니다.

// 시나리오 1: Google OAuth 로그인 플로우 테스트
async function testGoogleOAuthLoginFlow(authManager: AuthManager): Promise<TestResult> {
  const testName = '1. Google OAuth 로그인 플로우';
  const startTime = Date.now();
  
  try {
    
    // 1. 초기 상태 확인 (로그아웃 상태)
    console.log('    1단계: 초기 상태 확인');
    const initialUserInfo = await authManager.getCurrentUserInfo();
    if (initialUserInfo.success) {
      return {
        testName,
        success: false,
        error: '초기 상태에서 사용자 정보가 존재함 (로그아웃 상태여야 함)',
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 초기 상태: 로그아웃 상태 확인');

    // 2. Google OAuth 로그인
    console.log('    2단계: Google OAuth 로그인');
    const loginRequest: LoginRequest = {
      provider: 'google',
      authCode: 'valid-google-code'
    };
    const loginResponse = await authManager.login(loginRequest);
    if (!loginResponse.success) {
      return {
        testName,
        success: false,
        error: `Google 로그인 실패: ${loginResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ Google OAuth 로그인 성공');

    // 3. 로그인 후 사용자 정보 확인
    console.log('    3단계: 로그인 후 사용자 정보 확인');
    const userInfoResponse = await authManager.getCurrentUserInfo();
    if (!userInfoResponse.success) {
      return {
        testName,
        success: false,
        error: `로그인 후 사용자 정보 조회 실패: ${userInfoResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 사용자 정보 조회 성공');

    // 4. 토큰 검증
    console.log('    4단계: 토큰 검증');
    const tokenValidationResponse = await authManager.validateCurrentToken();
    if (!tokenValidationResponse.success) {
      return {
        testName,
        success: false,
        error: `토큰 검증 실패: ${tokenValidationResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 토큰 검증 성공');

    // 5. 로그아웃
    console.log('    5단계: 로그아웃');
    const logoutRequest: LogoutRequest = {
      provider: 'google'
    };
    const logoutResponse = await authManager.logout(logoutRequest);
    if (!logoutResponse.success) {
      return {
        testName,
        success: false,
        error: `로그아웃 실패: ${logoutResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 로그아웃 성공');

    // 6. 로그아웃 후 상태 확인
    console.log('    6단계: 로그아웃 후 상태 확인');
    const finalUserInfo = await authManager.getCurrentUserInfo();
    if (finalUserInfo.success) {
      return {
        testName,
        success: false,
        error: '로그아웃 후에도 사용자 정보가 존재함',
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 로그아웃 후 상태 확인 완료');

    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} 성공 (${duration}ms)`);

    return {
      testName,
        success: true,
      duration,
      details: {
        loginUser: loginResponse.data?.userInfo,
        tokenValidated: tokenValidationResponse.success
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${testName} 오류 (${duration}ms):`, error);
    
    return {
      testName,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      duration
    };
  }
}

// 시나리오 2: Google OAuth 토큰 관리 테스트
async function testGoogleOAuthTokenManagement(authManager: AuthManager): Promise<TestResult> {
  const testName = '2. Google OAuth 토큰 관리';
  const startTime = Date.now();
  
  try {
    
    // 1. 로그인하여 토큰 획득
    console.log('    1단계: Google OAuth 로그인');
    const loginRequest: LoginRequest = {
      provider: 'google',
      authCode: 'valid-google-code'
    };
    const loginResponse = await authManager.login(loginRequest);
    if (!loginResponse.success) {
      return {
        testName,
        success: false,
        error: `Google 로그인 실패: ${loginResponse.error}`,
        duration: Date.now() - startTime
      };
    }

    // 2. 토큰이 자동으로 저장되었는지 확인
    console.log('    2단계: 토큰 자동 저장 확인');
    const userInfoResponse = await authManager.getCurrentUserInfo();
    if (!userInfoResponse.success) {
      return {
        testName,
        success: false,
        error: '토큰이 자동으로 저장되지 않음',
        duration: Date.now() - startTime
      };
    }

    // 3. 토큰 검증이 자동으로 작동하는지 확인
    console.log('    3단계: 토큰 자동 검증 확인');
    const tokenValidationResponse = await authManager.validateCurrentToken();
    if (!tokenValidationResponse.success) {
      return {
        testName,
        success: false,
        error: '토큰 자동 검증 실패',
        duration: Date.now() - startTime
      };
    }

    // 4. 토큰 갱신 테스트
    console.log('    4단계: 토큰 갱신 테스트');
    const refreshRequest: RefreshTokenRequest = {
      provider: 'google',
      refreshToken: loginResponse.data?.refreshToken || 'invalid-refresh-token'
    };
    const refreshResponse = await authManager.refreshToken(refreshRequest);
    if (!refreshResponse.success) {
      return {
        testName,
        success: false,
        error: `토큰 갱신 실패: ${refreshResponse.error}`,
        duration: Date.now() - startTime
      };
    }

    // 5. 로그아웃하여 토큰 정리
    const logoutRequest: LogoutRequest = {
      provider: 'google'
    };
    await authManager.logout(logoutRequest);

    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} 성공 (${duration}ms)`);

    return {
      testName,
      success: true,
      duration,
      details: {
        tokenAutoSaved: true,
        tokenAutoValidated: true,
        tokenRefreshed: true
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${testName} 오류 (${duration}ms):`, error);
    
    return {
      testName,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      duration
    };
  }
}

// 시나리오 3: Google OAuth 에러 처리 테스트
async function testGoogleOAuthErrorHandling(authManager: AuthManager): Promise<TestResult> {
  const testName = '3. Google OAuth 에러 처리';
  const startTime = Date.now();
  
  try {
    
    // 1. 잘못된 인증 코드로 로그인 시도 (실패해야 함)
    console.log('    1단계: 잘못된 인증 코드로 로그인 시도');
    const invalidLoginRequest: LoginRequest = {
      provider: 'google',
      authCode: 'invalid-google-code'
    };
    const invalidLoginResponse = await authManager.login(invalidLoginRequest);
    
    // 잘못된 인증 코드로는 로그인이 실패해야 함
    if (invalidLoginResponse.success) {
      return {
        testName,
        success: false,
        error: '잘못된 인증 코드로도 로그인이 성공함',
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 잘못된 인증 코드 에러 처리 확인');

    // 2. 유효한 인증 코드로 로그인 시도 (성공해야 함)
    console.log('    2단계: 유효한 인증 코드로 로그인 시도');
    const validLoginRequest: LoginRequest = {
      provider: 'google',
      authCode: 'valid-google-code'
    };
    const validLoginResponse = await authManager.login(validLoginRequest);
    
    if (!validLoginResponse.success) {
      return {
        testName,
        success: false,
        error: `유효한 인증 코드로도 로그인 실패: ${validLoginResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 유효한 인증 코드 로그인 성공');

    // 3. 로그아웃
    const logoutRequest: LogoutRequest = {
        provider: 'google'
    };
    await authManager.logout(logoutRequest);

    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} 성공 (${duration}ms)`);

    return {
      testName,
      success: true,
      duration,
      details: {
        invalidCodeHandled: true,
        validCodeSuccess: true
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${testName} 오류 (${duration}ms):`, error);
    
    return {
      testName,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      duration
    };
  }
}

// =====================================
// 🧪 테스트 상태 관리 함수 (auth-core와 무관)
// =====================================
// 이 함수는 테스트 시나리오 간에 인증 상태를 초기화하기 위한 용도입니다.
// auth-core의 실제 기능과는 전혀 관련이 없으며, 테스트 격리를 위한 헬퍼 함수입니다.

// 테스트 시나리오 간 상태 초기화 함수
async function clearAuthState(authManager: AuthManager): Promise<void> {
  try {
    // 현재 토큰이 있다면 로그아웃
    const userInfo = await authManager.getCurrentUserInfo();
    if (userInfo.success) {
      // 토큰이 있으면 로그아웃 시도
      const logoutRequest: LogoutRequest = {
        provider: 'google'
      };
      await authManager.logout(logoutRequest);
    }
  } catch (error) {
    // 에러가 발생해도 무시 (이미 로그아웃 상태일 수 있음)
  }
}

async function printTestSummary(testResults: TestResult[], startTime: number): Promise<void> {
  const totalDuration = Date.now() - startTime;
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log('\n=====================================');
  console.log('📊 Auth Core Google OAuth 통합테스트 결과 요약');
  console.log('=====================================');
  console.log(`총 시나리오: ${totalTests}`);
  console.log(`✅ 성공: ${passedTests}`);
  console.log(`❌ 실패: ${failedTests}`);
  console.log(`⏱️  총 소요시간: ${totalDuration}ms`);
  console.log('=====================================\n');

  if (failedTests > 0) {
    console.log('❌ 실패한 시나리오:');
    testResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.testName}: ${r.error || '알 수 없는 오류'}`);
      });
    console.log('');
  }

  if (passedTests === totalTests) {
    console.log('🎉 모든 Google OAuth 시나리오가 성공했습니다!');
    console.log('✅ AuthManager가 Google OAuth 인증 흐름을 올바르게 제어하고 있습니다.');
  } else {
    console.log('⚠️  일부 Google OAuth 시나리오가 실패했습니다.');
  }
}

// =====================================
// 🚀 CLI 진입점
// =====================================
// 이 섹션은 tsx로 직접 실행할 때 사용되는 진입점입니다.
// 환경 변수 TEST_MODE에 따라 적절한 테스트 모드를 설정합니다.

async function main() {
  const testMode = process.env.TEST_MODE || 'local';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  console.log(`🔧 테스트 모드: ${testMode}`);
  console.log(`🌐 백엔드 URL: ${backendUrl}`);
  console.log('');

  // API 설정
  const apiConfig: ApiConfig = {
    apiBaseUrl: backendUrl,
    endpoints: {
      requestVerification: '/api/v1/auth/email/request',
      verifyEmail: '/api/v1/auth/email/verify',
      login: '/api/v1/auth/members/email-login',
      logout: '/api/v1/auth/members/logout',
      refresh: '/api/v1/auth/members/refresh',
      validate: '/api/v1/auth/validate-token',
      me: '/api/v1/auth/user-info',
      health: '/api/v1/health',
      // 구글 인증 엔드포인트
      googleLogin: '/api/v1/auth/google/login',
      googleLogout: '/api/v1/auth/google/logout',
      googleRefresh: '/api/v1/auth/google/refresh',
      googleValidate: '/api/v1/auth/google/validate',
      googleUserinfo: '/api/v1/auth/google/userinfo'
    },
    timeout: 10000
  };

  // HttpClient 생성 (MSW 모드에서는 MSW HttpClient 사용)
  let httpClient: HttpClient;
  if (testMode === 'msw') {
    const { MSWHttpClient } = await import('../mocks/MSWHttpClient');
    httpClient = new MSWHttpClient();
  } else {
    const { RealHttpClient } = await import('../../examples/web-demo/src/http-clients/RealHttpClient');
    httpClient = new RealHttpClient();
  }

  // Google Provider 설정
  const googleConfig = {
    googleClientId: 'test-google-client-id',
    timeout: 10000,
    retryCount: 3
  };

  // AuthManager 생성 (Google Provider 사용)
  const authManager = new AuthManager({
    providerType: 'google',
    apiConfig,
    httpClient,
    providerConfig: googleConfig
  });

  // MSW 모드인 경우 MSW 서버 시작
  if (testMode === 'msw') {
    const { startMSWServer, stopMSWServer } = await import('../setup/msw.server');
    
    console.log('🚀 MSW 서버를 시작합니다...');
    startMSWServer();
    console.log('✅ MSW 서버가 시작되었습니다.');
    console.log('📡 모킹된 Google OAuth API 엔드포인트:');
    console.log(`   - POST ${apiConfig.endpoints.googleLogin}`);
    console.log(`   - POST ${apiConfig.endpoints.googleLogout}`);
    console.log(`   - POST ${apiConfig.endpoints.googleRefresh}`);
    console.log(`   - GET  ${apiConfig.endpoints.googleValidate}`);
    console.log(`   - GET  ${apiConfig.endpoints.googleUserinfo}`);
    console.log('');
    
    try {
      await runGoogleIntegrationTests(authManager, apiConfig, testMode);
    } finally {
      console.log('🛑 MSW 서버를 중지합니다...');
      stopMSWServer();
      console.log('✅ MSW 서버가 중지되었습니다.');
    }
  } else {
    // 일반 모드 (local, deployed, custom)
    await runGoogleIntegrationTests(authManager, apiConfig, testMode);
  }
}

// CLI에서 직접 실행될 때만 main 함수 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI 실행 중 오류 발생:', error);
    process.exit(1);
  });
}
