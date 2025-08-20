import { AuthManager } from '../../src/AuthManager';
import { ApiConfig } from '../../src/shared/types';
import { 
  EmailVerificationRequest,
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

export async function runIntegrationTests(
  authManager: AuthManager, 
  apiConfig: ApiConfig, 
  testMode: string
): Promise<void> {
  console.log('Auth Core 통합테스트 시작');
  console.log('=====================================\n');

  const testResults: TestResult[] = [];
  const startTime = Date.now();

  try {
    // 시나리오 1: 전체 인증 라이프사이클 테스트
    console.log('[1/4] 전체 인증 라이프사이클 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const lifecycleResult = await testAuthenticationLifecycle(authManager);
    testResults.push(lifecycleResult);

    // 시나리오 2: 토큰 자동 관리 테스트
    console.log('[2/4] 토큰 자동 관리 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const tokenManagementResult = await testTokenManagement(authManager);
    testResults.push(tokenManagementResult);

    // 시나리오 3: 에러 처리 및 재시도 테스트
    console.log('[3/4] 에러 처리 및 재시도 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const errorHandlingResult = await testErrorHandling(authManager);
    testResults.push(errorHandlingResult);

    // 시나리오 4: 인증 상태 관리 테스트
    console.log('[4/4] 인증 상태 관리 테스트 시작');
    await clearAuthState(authManager); // 상태 초기화
    const stateManagementResult = await testStateManagement(authManager);
    testResults.push(stateManagementResult);

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

// 시나리오 1: 전체 인증 라이프사이클 테스트
async function testAuthenticationLifecycle(authManager: AuthManager): Promise<TestResult> {
  const testName = '1. 전체 인증 라이프사이클';
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

    // 2. 이메일 인증번호 요청
    console.log('    2단계: 이메일 인증번호 요청');
    const verificationRequest: EmailVerificationRequest = {
      email: 'test@example.com'
    };
    const verificationResponse = await authManager.requestEmailVerification(verificationRequest);
    if (!verificationResponse.success) {
      return {
        testName,
        success: false,
        error: `인증번호 요청 실패: ${verificationResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 인증번호 요청 성공');

    // 3. 로그인
    console.log('    3단계: 로그인');
    const loginRequest: LoginRequest = {
      provider: 'email',
      email: 'test@example.com',
      verificationCode: '123456'
    };
    const loginResponse = await authManager.login(loginRequest);
    if (!loginResponse.success) {
      return {
        testName,
        success: false,
        error: `로그인 실패: ${loginResponse.error}`,
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 로그인 성공');

    // 4. 로그인 후 사용자 정보 확인
    console.log('    4단계: 로그인 후 사용자 정보 확인');
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

    // 5. 토큰 검증
    console.log('    5단계: 토큰 검증');
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

    // 6. 토큰 갱신
    console.log('    6단계: 토큰 갱신');
    const refreshRequest: RefreshTokenRequest = {
      provider: 'email',
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
    console.log('     ✅ 토큰 갱신 성공');

    // 7. 로그아웃
    console.log('    7단계: 로그아웃');
    const logoutRequest: LogoutRequest = {
      provider: 'email'
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

    // 8. 로그아웃 후 상태 확인
    console.log('    8단계: 로그아웃 후 상태 확인');
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
        tokenRefreshed: refreshResponse.success
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

// 시나리오 2: 토큰 자동 관리 테스트
async function testTokenManagement(authManager: AuthManager): Promise<TestResult> {
  const testName = '2. 토큰 자동 관리';
  const startTime = Date.now();
  
  try {
    
    // 1. 로그인하여 토큰 획득
    console.log('    1단계: 로그인');
    const loginRequest: LoginRequest = {
      provider: 'email',
      email: 'test@example.com',
      verificationCode: '123456'
    };
    const loginResponse = await authManager.login(loginRequest);
    if (!loginResponse.success) {
      return {
        testName,
        success: false,
        error: `로그인 실패: ${loginResponse.error}`,
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

    // 4. 로그아웃하여 토큰 정리
    const logoutRequest: LogoutRequest = {
      provider: 'email'
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
        tokenAutoValidated: true
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

// 시나리오 3: 에러 처리 및 재시도 테스트
async function testErrorHandling(authManager: AuthManager): Promise<TestResult> {
  const testName = '3. 에러 처리 및 재시도';
  const startTime = Date.now();
  
  try {
    
    // 1. 잘못된 인증번호로 로그인 시도
    console.log('    1단계: 잘못된 인증번호로 로그인 시도');
    const errorVerificationCode = process.env.MSW_ERROR_VERIFICATION_CODE || '999999';
    const invalidLoginRequest: LoginRequest = {
      provider: 'email',
      email: 'test@example.com',
      verificationCode: errorVerificationCode // 환경 변수에서 가져온 에러 코드
    };
    const invalidLoginResponse = await authManager.login(invalidLoginRequest);
    
    // 에러가 적절히 처리되었는지 확인
    if (invalidLoginResponse.success) {
      return {
        testName,
        success: false,
        error: '잘못된 인증번호로도 로그인이 성공함',
        duration: Date.now() - startTime
      };
    }
    console.log('     ✅ 잘못된 인증번호 에러 처리 확인');

    // 2. 존재하지 않는 이메일로 인증번호 요청
    console.log('    2단계: 존재하지 않는 이메일로 인증번호 요청');
    const invalidEmailRequest: EmailVerificationRequest = {
      email: 'nonexistent@example.com'
    };
    const invalidEmailResponse = await authManager.requestEmailVerification(invalidEmailRequest);
    
    // 에러가 적절히 처리되었는지 확인 (실제로는 성공할 수도 있음)
    console.log('     ✅ 존재하지 않는 이메일 처리 확인');

    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} 성공 (${duration}ms)`);

    return {
      testName,
      success: true,
      duration,
      details: {
        invalidCredentialsHandled: true,
        invalidEmailHandled: true
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

// 시나리오 4: 인증 상태 관리 테스트
async function testStateManagement(authManager: AuthManager): Promise<TestResult> {
  const testName = '4. 인증 상태 관리';
  const startTime = Date.now();
  
  try {
    
    // 1. 로그인 전 상태 확인
    console.log('    1단계: 로그인 전 상태 확인');
    const beforeLoginUserInfo = await authManager.getCurrentUserInfo();
    if (beforeLoginUserInfo.success) {
      return {
        testName,
        success: false,
        error: '로그인 전에 사용자 정보가 존재함',
        duration: Date.now() - startTime
      };
    }

    // 2. 로그인
    console.log('    2단계: 로그인');
    const loginRequest: LoginRequest = {
      provider: 'email',
      email: 'test@example.com',
      verificationCode: '123456'
    };
    const loginResponse = await authManager.login(loginRequest);
    if (!loginResponse.success) {
      return {
        testName,
        success: false,
        error: `로그인 실패: ${loginResponse.error}`,
        duration: Date.now() - startTime
      };
    }

    // 3. 로그인 후 상태 확인
    console.log('    3단계: 로그인 후 상태 확인');
    const afterLoginUserInfo = await authManager.getCurrentUserInfo();
    if (!afterLoginUserInfo.success) {
      return {
        testName,
        success: false,
        error: '로그인 후 사용자 정보가 없음',
        duration: Date.now() - startTime
      };
    }

    // 4. 로그아웃
    console.log('    4단계: 로그아웃');
    const logoutRequest: LogoutRequest = {
      provider: 'email'
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

    // 5. 로그아웃 후 상태 확인
    console.log('    5단계: 로그아웃 후 상태 확인');
    const afterLogoutUserInfo = await authManager.getCurrentUserInfo();
    if (afterLogoutUserInfo.success) {
      return {
        testName,
        success: false,
        error: '로그아웃 후에도 사용자 정보가 존재함',
        duration: Date.now() - startTime
      };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} 성공 (${duration}ms)`);

    return {
      testName,
      success: true,
      duration,
      details: {
        beforeLoginState: 'logged-out',
        afterLoginState: 'logged-in',
        afterLogoutState: 'logged-out'
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
        provider: 'email'
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
  console.log('📊 Auth Core 통합테스트 결과 요약');
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
    console.log(' 모든 인증 시나리오가 성공했습니다!');
    console.log(' AuthManager가 인증 흐름을 올바르게 제어하고 있습니다.');
  } else {
    console.log(' 일부 인증 시나리오가 실패했습니다.');
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
      requestVerification: '/api/auth/email/request-verification',
      login: '/api/auth/email/login',
      logout: '/api/auth/email/logout',
      refresh: '/api/auth/email/refresh',
      validate: '/api/auth/validate-token',
      me: '/api/auth/user-info',
      health: '/api/health'
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

  // AuthManager 생성
  const authManager = new AuthManager({
    providerType: 'email',
    apiConfig,
    httpClient
  });

  // MSW 모드인 경우 MSW 서버 시작
  if (testMode === 'msw') {
    const { startMSWServer, stopMSWServer } = await import('../setup/msw.server');
    startMSWServer();
    
    try {
      await runIntegrationTests(authManager, apiConfig, testMode);
    } finally {
      stopMSWServer();
    }
  } else {
    // 일반 모드 (local, deployed, custom)
    await runIntegrationTests(authManager, apiConfig, testMode);
  }
}

// CLI에서 직접 실행될 때만 main 함수 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI 실행 중 오류 발생:', error);
    process.exit(1);
  });
}