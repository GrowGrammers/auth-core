import { http, HttpResponse } from 'msw';

// MSW 핸들러 - 백엔드 없이도 API 응답을 모킹
// 와일드카드 패턴을 사용하여 모든 호스트에서 동일한 경로 처리

// 랜덤 토큰 생성 헬퍼 함수
function generateRandomToken(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

function generateExpiresAt(): number {
  return Date.now() + 3600000; // 1시간 후 만료
}

export const handlers = [
  // 이메일 인증번호 요청
  http.post('*/api/v1/auth/email/request', async ({ request }) => {
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

  // 이메일 인증번호 확인
  http.post('*/api/v1/auth/email/verify', async ({ request }) => {
    const body = await request.json() as any;
    
    // 잘못된 인증번호에 대한 에러 응답
    if (body.code === '999999') {
      return HttpResponse.json({
        success: false,
        message: '잘못된 인증번호입니다.',
        data: null,
        error: 'INVALID_VERIFICATION_CODE'
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      data: null
    });
  }),

  // 이메일 로그인
  http.post('*/api/v1/auth/email/login', async ({ request }) => {
    const body = await request.json() as any;
    
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
        expiresAt: generateExpiresAt(),
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
    const body = await request.json() as any;
    
    // 잘못된 구글 토큰에 대한 에러 응답
    if (body.googleToken === 'invalid-token') {
      return HttpResponse.json({
        success: false,
        message: '잘못된 구글 토큰입니다.',
        data: null,
        error: 'INVALID_GOOGLE_TOKEN'
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      success: true,
      message: '구글 로그인에 성공했습니다.',
      data: {
        accessToken: generateRandomToken('google-access-token'),
        refreshToken: generateRandomToken('google-refresh-token'),
        expiresAt: generateExpiresAt(),
        userInfo: {
          id: 'google-user-123',
          email: 'google@example.com',
          nickname: '구글 사용자',
          provider: 'google'
        }
      }
    });
  }),

  // 토큰 검증
  http.get('*/api/v1/auth/validate-token', () => {
    return HttpResponse.json({
      success: true,
      message: '토큰이 유효합니다.',
      data: true
    });
  }),

  // 사용자 정보 조회
  http.get('*/api/v1/auth/user-info', () => {
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
  http.post('*/api/v1/auth/email/refresh', () => {
    return HttpResponse.json({
      success: true,
      message: '토큰이 성공적으로 갱신되었습니다.',
      data: {
        accessToken: generateRandomToken('new-mock-access-token'),
        refreshToken: generateRandomToken('new-mock-refresh-token'),
        expiresAt: generateExpiresAt(),
        tokenType: 'Bearer'
      }
    });
  }),

  // 로그아웃
  http.post('*/api/v1/auth/email/logout', () => {
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
  })
];
