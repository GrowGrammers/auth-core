import { http, HttpResponse } from 'msw';

// MSW 핸들러 - 백엔드 없이도 API 응답을 모킹
// 와일드카드 패턴을 사용하여 모든 호스트에서 동일한 경로 처리

// 랜덤 토큰 생성 헬퍼 함수
function generateRandomToken(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

function generateExpiredAt(): number {
  return Date.now() + 3600000; // 1시간 후 만료
}

// 테스트용 인증 코드 저장소 (메모리 기반)
const verificationCodes = new Map<string, string>();

// 테스트에서 인증 코드를 가져올 수 있는 헬퍼 함수
export function getVerificationCode(email: string): string | undefined {
  return verificationCodes.get(email);
}

// 테스트에서 인증 코드를 설정할 수 있는 헬퍼 함수
export function setVerificationCode(email: string, code: string): void {
  verificationCodes.set(email, code);
}

// 테스트에서 인증 코드를 제거할 수 있는 헬퍼 함수
export function clearVerificationCode(email: string): void {
  verificationCodes.delete(email);
}

export const handlers = [
  // 이메일 인증번호 요청
  http.post('*/api/v1/auth/email/request', async ({ request }) => {
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('MSW: JSON 파싱 에러:', error);
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_JSON'
      }, { status: 400 });
    }
    
    // 존재하지 않는 이메일에 대한 에러 응답
    if (body.email === 'nonexistent@example.com') {
      return HttpResponse.json({
        success: false,
        message: '존재하지 않는 이메일입니다.',
        data: null,
        error: '존재하지 않는 이메일입니다.'
      }, { status: 404 });
    }
    
    // 인증 코드 생성 및 저장
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(body.email, verificationCode);
    
    // 테스트 환경에서는 콘솔에 인증 코드 출력 (실제로는 이메일로 전송)
    console.log(`📧 [MSW] ${body.email}로 인증번호 전송: ${verificationCode}`);
    
    return HttpResponse.json({
      success: true,
      message: '인증번호가 전송되었습니다.',
      data: null
    });
  }),

  // 이메일 인증번호 확인
  http.post('*/api/v1/auth/email/verify', async ({ request }) => {
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('MSW: JSON 파싱 에러:', error);
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_JSON'
      }, { status: 400 });
    }
    
    // 저장된 인증 코드와 비교
    const storedCode = verificationCodes.get(body.email);
    
    if (!storedCode) {
      return HttpResponse.json({
        success: false,
        message: '인증번호를 먼저 요청해주세요.',
        data: null,
        error: 'VERIFICATION_CODE_NOT_REQUESTED'
      }, { status: 400 });
    }
    
    if (body.verifyCode !== storedCode) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 인증번호입니다.',
        data: null,
        error: 'INVALID_VERIFICATION_CODE'
      }, { status: 400 });
    }
    
    // 인증 성공 시 코드 제거 (일회성 사용)
    verificationCodes.delete(body.email);
    
    return HttpResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      data: null
    });
  }),

  // 이메일 로그인
  http.post('*/api/v1/auth/members/email-login', async ({ request }) => {
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('MSW: JSON 파싱 에러:', error);
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_JSON'
      }, { status: 400 });
    }
    
    // 이메일이 없는 경우 에러 응답
    if (!body.email) {
      return HttpResponse.json({
        success: false,
        message: '이메일이 필요합니다.',
        data: null,
        error: 'EMAIL_REQUIRED'
      }, { status: 400 });
    }

    // 이메일 인증이 완료되지 않은 경우 에러 응답 (테스트 용)
    // 실제로는 서버에서 이메일 인증 상태를 확인해야 함
    if (body.email === 'unverified@example.com') {
      return HttpResponse.json({
        success: false,
        message: '이메일 인증이 필요합니다.',
        data: null,
        error: 'EMAIL_VERIFICATION_REQUIRED'
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        accessToken: generateRandomToken('mock-access-token'),
        refreshToken: generateRandomToken('mock-refresh-token'),
        expiredAt: generateExpiredAt(),
        userInfo: {
          id: 'user-123',
          email: 'test@example.com',
          nickname: '테스트 사용자',
          provider: 'email'
        }
      }
    });
  }),

  // 구글 로그인
  http.post('*/api/v1/auth/google/login', async ({ request }) => {
    let body: any = {};
    try {
      body = await request.json();           // ← 핵심!
    } catch (error) {
      console.error('MSW: Google 로그인 body 파싱 에러:', error);
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_REQUEST_BODY'
      }, { status: 400 });
    }

    const { authCode } = body;
    console.log('MSW: parsed body.authCode =', authCode);

    if (authCode !== 'valid-google-code') {
      return HttpResponse.json({
        success: false,
        message: '유효하지 않은 Google 인증 코드입니다.',
        data: null,
        error: 'INVALID_GOOGLE_CODE'
      }, { status: 400 });
    }

    const googleAccessToken = generateRandomToken('google-access-token');
    const googleRefreshToken = generateRandomToken('google-refresh-token');

    return HttpResponse.json({
      success: true,
      message: '구글 로그인에 성공했습니다.',
      data: {
        accessToken: googleAccessToken,
        refreshToken: googleRefreshToken,
        expiredAt: generateExpiredAt(),
        userInfo: {
          id: 'google-user-123',
          email: 'google@example.com',
          nickname: '구글 사용자',
          provider: 'google'
        }
      }
    });
  }),

  // 구글 로그아웃
  http.post('*/api/v1/auth/google/logout', () => {
    return HttpResponse.json({
      success: true,
      message: '구글 로그아웃에 성공했습니다.',
      data: null
    });
  }),

  // 구글 토큰 갱신
  http.post('*/api/v1/auth/google/refresh', () => {
    return HttpResponse.json({
      success: true,
      message: '구글 토큰이 성공적으로 갱신되었습니다.',
      data: {
        accessToken: generateRandomToken('new-google-access-token'),
        refreshToken: generateRandomToken('new-google-refresh-token'),
        expiredAt: generateExpiredAt(),
        tokenType: 'Bearer'
      }
    });
  }),

  // 토큰 검증 - POST 방식으로 통일
  http.post('*/api/v1/auth/validate-token', async ({ request }) => {
    let body: any;
    
    try {
      body = await request.json();
    } catch (error) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: false,
        error: 'INVALID_REQUEST_BODY'
      }, { status: 400 });
    }
    
    if (!body.accessToken) {
      return HttpResponse.json({
        success: false,
        message: '액세스 토큰이 필요합니다.',
        data: false,
        error: 'MISSING_ACCESS_TOKEN'
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '토큰이 유효합니다.',
      data: true
    });
  }),



  // Google 토큰 검증 (Google 전용) - POST 방식
  http.post('*/api/v1/auth/google/validate', async ({ request }) => {
    let body: any;
    
    try {
      // MSW에서는 항상 request.json()을 사용해야 함
      body = await request.json();
    } catch (error) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: false,
        error: 'INVALID_REQUEST_BODY'
      }, { status: 400 });
    }
    
    // Google 액세스 토큰 검증
    if (!body.accessToken || !body.accessToken.startsWith('google-access-token-')) {
      return HttpResponse.json({
        success: false,
        message: '유효하지 않은 Google 액세스 토큰입니다.',
        data: false,
        error: 'INVALID_GOOGLE_TOKEN'
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Google 토큰이 유효합니다.',
      data: true
    });
  }),

  // 사용자 정보 조회 - POST 방식으로 통일
  http.post('*/api/v1/auth/user-info', async ({ request }) => {
    let body: any;
    
    try {
      body = await request.json();
    } catch (error) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_REQUEST_BODY'
      }, { status: 400 });
    }
    
    if (!body.accessToken) {
      return HttpResponse.json({
        success: false,
        message: '액세스 토큰이 필요합니다.',
        data: null,
        error: 'MISSING_ACCESS_TOKEN'
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '사용자 정보를 성공적으로 가져왔습니다.',
      data: {
        id: 'user-123',
        email: 'test@example.com',
        nickname: '테스트 사용자',
        provider: 'email'
      }
    });
  }),



  // Google 사용자 정보 조회 (Google 전용) - POST 방식
  http.post('*/api/v1/auth/google/userinfo', async ({ request }) => {
    let body: any;
    
    try {
      // MSW에서는 항상 request.json()을 사용해야 함
      body = await request.json();
    } catch (error) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 요청 형식입니다.',
        data: null,
        error: 'INVALID_REQUEST_BODY'
      }, { status: 400 });
    }
    
    // Google 액세스 토큰 검증
    if (!body.accessToken || !body.accessToken.startsWith('google-access-token-')) {
      return HttpResponse.json({
        success: false,
        message: '유효하지 않은 Google 액세스 토큰입니다.',
        data: null,
        error: 'INVALID_GOOGLE_TOKEN'
      }, { status: 401 });
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Google 사용자 정보를 성공적으로 가져왔습니다.',
      data: {
        id: 'google-user-123',
        email: 'google@example.com',
        nickname: '구글 사용자',
        provider: 'google'
      }
    });
  }),

  // 토큰 갱신
  http.post('*/api/v1/auth/members/refresh', () => {
    return HttpResponse.json({
      success: true,
      message: '토큰이 성공적으로 갱신되었습니다.',
      data: {
        accessToken: generateRandomToken('new-mock-access-token'),
        refreshToken: generateRandomToken('new-mock-refresh-token'),
        expiredAt: generateExpiredAt(),

        tokenType: 'Bearer'
      }
    });
  }),

  // 로그아웃
  http.post('*/api/v1/auth/members/logout', () => {
    return HttpResponse.json({
      success: true,
      message: '로그아웃에 성공했습니다.',
      data: null
    });
  }),

  // 헬스체크
  http.get('*/api/v1/health', () => {
    return HttpResponse.json({
      success: true,
      message: '서비스가 정상적으로 동작하고 있습니다.',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  }),

  // Google OAuth 콜백 모킹 (MSW로 OAuth 플로우 완전 모킹)
  http.get('*/auth/google/callback', ({ request }) => {
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    
    console.log('MSW: Google OAuth 콜백 호출됨');
    
    // state 검증 (실제 OAuth에서는 보안을 위해 필수)
    if (!state || !code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>OAuth Error</h1>
          <p>Invalid state or code parameter</p>
          <script>
            window.opener.postMessage({ 
              type: 'OAUTH_ERROR', 
              error: 'Invalid parameters' 
            }, window.location.origin);
            window.close();
          </script>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // 성공적인 OAuth 콜백 응답
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>OAuth Success</title></title>
      <body>
        <h1>OAuth Success!</h1>
        <p>Authorization code received successfully</p>
        <script>
          // 부모 창에 성공 메시지 전송
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_SUCCESS', 
              code: '${code}',
              state: '${state}'
            }, window.location.origin);
            window.close();
          } else {
            // 팝업이 아닌 경우 현재 창에서 처리
            window.location.href = '/?oauth_success=true&code=${code}&state=${state}';
          }
        </script>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  })
];