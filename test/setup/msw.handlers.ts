import { http, HttpResponse } from 'msw';

// MSW 핸들러 - 백엔드 없이도 API 응답을 모킹
// 와일드카드 패턴을 사용하여 모든 호스트에서 동일한 경로 처리
export const handlers = [
  // 이메일 인증번호 요청
  http.post('*/api/auth/email/request-verification', async ({ request }) => {
    const body = await request.json() as any;
    
    // 존재하지 않는 이메일에 대한 에러 응답
    if (body.email === 'nonexistent@example.com') {
      return HttpResponse.json({
        success: false,
        message: '존재하지 않는 이메일입니다.',
        data: null,
        error: '존재하지 않는 이메일입니다.'
      }, { status: 404 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '인증번호가 전송되었습니다.',
      data: null
    });
  }),

  // 이메일 로그인
  http.post('*/api/auth/email/login', async ({ request }) => {
    const body = await request.json() as any;
    
    // 환경 변수로 에러 시뮬레이션 제어
    const shouldSimulateError = process.env.MSW_SIMULATE_LOGIN_ERROR === 'true';
    const errorVerificationCode = process.env.MSW_ERROR_VERIFICATION_CODE || '999999';
    
    // 잘못된 인증번호에 대한 에러 응답
    if (shouldSimulateError && body.verificationCode === errorVerificationCode) {
      return HttpResponse.json({
        success: false,
        message: '잘못된 인증번호입니다.',
        data: null,
        error: '잘못된 인증번호입니다.'
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        accessToken: 'mock-access-token-123',
        refreshToken: 'mock-refresh-token-456',
        expiresAt: Date.now() + 3600000, // 1시간 후 만료
        userInfo: {
          id: 'user-123',
          email: 'test@example.com',
          nickname: '테스트 사용자',
          provider: 'email'
        }
      }
    });
  }),

  // 토큰 검증
  http.get('*/api/auth/validate-token', () => {
    return HttpResponse.json({
      success: true,
      message: '토큰이 유효합니다.',
      data: true
    });
  }),

  // 사용자 정보 조회
  http.get('*/api/auth/user-info', () => {
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

  // 토큰 갱신
  http.post('*/api/auth/email/refresh', () => {
    return HttpResponse.json({
      success: true,
      message: '토큰이 성공적으로 갱신되었습니다.',
      data: {
        accessToken: 'new-mock-access-token-789',
        refreshToken: 'new-mock-refresh-token-012',
        expiresAt: Date.now() + 3600000, // 1시간 후 만료
        tokenType: 'Bearer'
      }
    });
  }),

  // 로그아웃
  http.post('*/api/auth/email/logout', () => {
    return HttpResponse.json({
      success: true,
      message: '로그아웃에 성공했습니다.',
      data: null
    });
  }),

  // 헬스체크
  http.get('*/api/health', () => {
    return HttpResponse.json({
      success: true,
      message: '서비스가 정상적으로 동작하고 있습니다.',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  })
];
