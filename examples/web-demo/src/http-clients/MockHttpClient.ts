import type { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// 간단한 모킹 HTTP 클라이언트 - MSW 없이도 API 응답을 모킹
export class MockHttpClient implements HttpClient {
  private generateRandomToken(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }
  private generateExpiredAt(): number {
    return Date.now() + 3600000; // 1시간 후 만료
  }
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const { method = 'GET', url, body } = config;
    
    // URL에 따른 모킹 응답
    if (url.includes('/api/v1/auth/email/request') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '인증번호가 전송되었습니다.',
          data: null
        }),
        text: async () => '{"success":true,"message":"인증번호가 전송되었습니다.","data":null}'
      };
    }
    
    // 이메일 인증번호 확인
    if (url.includes('/api/v1/auth/email/verify') && method === 'POST') {
      // 요청 본문에서 email과 verifyCode 확인
      let requestBody: any;
      if (typeof body === 'string') {
        try {
          requestBody = JSON.parse(body);
        } catch (e) {
          requestBody = {};
        }
      } else {
        requestBody = body;
      }
      const verifyCode = requestBody?.verifyCode;  // code → verifyCode로 통일
      
      // 잘못된 인증번호인 경우 실패 응답
      if (verifyCode === '999999') {  // code → verifyCode로 통일
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          json: async () => ({
            success: false,
            message: '잘못된 인증번호입니다.',
            data: null,
            error: 'INVALID_VERIFICATION_CODE'
          }),
          text: async () => '{"success":false,"message":"잘못된 인증번호입니다.","error":"INVALID_VERIFICATION_CODE"}'
        };
      }
      
      // 올바른 인증번호인 경우 성공 응답
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '이메일 인증이 완료되었습니다.',
          data: null
        }),
        text: async () => '{"success":true,"message":"이메일 인증이 완료되었습니다.","data":null}'
      };
    }
    
    // 이메일 로그인
    if (url.includes('/api/v1/auth/members/email-login') && method === 'POST') {
      // 요청 본문에서 email 확인
      let requestBody: any;
      if (typeof body === 'string') {
        try {
          requestBody = JSON.parse(body);
        } catch (e) {
          requestBody = {};
        }
      } else {
        requestBody = body;
      }
      const email = requestBody?.email;
      
      // 이메일이 없는 경우 에러 응답
      if (!email) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          json: async () => ({
            success: false,
            message: '이메일이 필요합니다.',
            data: null,
            error: 'EMAIL_REQUIRED'
          }),
          text: async () => '{"success":false,"message":"이메일이 필요합니다.","error":"EMAIL_REQUIRED"}'
        };
      }

      // 이메일 인증이 완료되지 않은 경우 에러 응답 (MSW와 동일한 로직)
      if (email === 'unverified@example.com') {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          json: async () => ({
            success: false,
            message: '이메일 인증이 필요합니다.',
            data: null,
            error: 'EMAIL_VERIFICATION_REQUIRED'
          }),
          text: async () => '{"success":false,"message":"이메일 인증이 필요합니다.","error":"EMAIL_VERIFICATION_REQUIRED"}'
        };
      }
      
      // 올바른 이메일인 경우 성공 응답
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '로그인에 성공했습니다.',
          data: {
            accessToken: this.generateRandomToken('mock-access-token'),
            refreshToken: this.generateRandomToken('mock-refresh-token'),
            expiredAt: this.generateExpiredAt(),
            userInfo: {
              id: 'user-123',
              email: email,
              nickname: '테스트 사용자',
              provider: 'email'
            }
          }
        }),
        text: async () => 'mock login response'
      };
    }
    
    if (url.includes('/api/v1/auth/validate-token') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '토큰이 유효합니다.',
          data: true
        }),
        text: async () => '{"success":true,"message":"토큰이 유효합니다.","data":true}'
      };
    }
    
    if (url.includes('/api/v1/auth/user-info') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '사용자 정보를 성공적으로 가져왔습니다.',
          data: {
            id: 'user-123',
            email: 'test@example.com',
            nickname: '테스트 사용자',
            provider: 'email'
          }
        }),
        text: async () => 'mock user info response'
      };
    }
    if (url.includes('/api/v1/auth/members/refresh') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '토큰 갱신에 성공했습니다.',
          data: {
            accessToken: this.generateRandomToken('new-mock-access-token'),
            refreshToken: this.generateRandomToken('new-mock-refresh-token'),
            expiredAt: this.generateExpiredAt()
          }
        }),
        text: async () => 'mock refresh response'
      };
    }
    if (url.includes('/api/v1/auth/members/logout') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '로그아웃에 성공했습니다.',
          data: null
        }),
        text: async () => '{"success":true,"message":"로그아웃에 성공했습니다.","data":null}'
      };
    }
    
    // 구글 로그인
    if (url.includes('/api/v1/auth/google/login') && method === 'POST') {
      // 요청 본문에서 googleToken 확인
      let requestBody: any;
      if (typeof body === 'string') {
        try {
          requestBody = JSON.parse(body);
        } catch (e) {
          requestBody = {};
        }
      } else {
        requestBody = body;
      }
      const googleToken = requestBody?.googleToken;
      
      // 잘못된 구글 토큰인 경우 실패 응답
      if (googleToken === 'invalid-token') {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          json: async () => ({
            success: false,
            message: '잘못된 구글 토큰입니다.',
            data: null,
            error: 'INVALID_GOOGLE_TOKEN'
          }),
          text: async () => '{"success":false,"message":"잘못된 구글 토큰입니다.","error":"INVALID_GOOGLE_TOKEN"}'
        };
      }
      
      // 올바른 구글 토큰인 경우 성공 응답
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '구글 로그인에 성공했습니다.',
          data: {
            accessToken: this.generateRandomToken('google-access-token'),
            refreshToken: this.generateRandomToken('google-refresh-token'),
            expiredAt: this.generateExpiredAt(),
            userInfo: {
              id: 'google-user-123',
              email: 'google@example.com',
              nickname: '구글 사용자',
              provider: 'google'
            }
          }
        }),
        text: async () => 'mock google login response'
      };
    }

    // 구글 로그아웃
    if (url.includes('/api/v1/auth/google/logout') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '구글 로그아웃에 성공했습니다.',
          data: null
        }),
        text: async () => '{"success":true,"message":"구글 로그아웃에 성공했습니다.","data":null}'
      };
    }

    // 구글 토큰 갱신
    if (url.includes('/api/v1/auth/google/refresh') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '구글 토큰이 성공적으로 갱신되었습니다.',
          data: {
            accessToken: this.generateRandomToken('new-google-access-token'),
            refreshToken: this.generateRandomToken('new-google-refresh-token'),
            expiredAt: this.generateExpiredAt(),
            tokenType: 'Bearer'
          }
        }),
        text: async () => 'mock google refresh response'
      };
    }
    
    if (url.includes('/api/v1/health') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '서비스가 정상적으로 작동하고 있습니다.',
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString()
          }
        }),
        text: async () => 'mock health response'
      };
    }
    
    // 기본 응답
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {},
      json: async () => ({
        success: false,
        message: `지원하지 않는 엔드포인트: ${method} ${url}`,
        error: 'ENDPOINT_NOT_FOUND'
      }),
      text: async () => `지원하지 않는 엔드포인트: ${method} ${url}`
    };
  }

  async get(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'GET', url });
  }

  async post(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'POST', url, body: data });
  }

  async put(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'PUT', url, body: data });
  }

  async delete(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'DELETE', url });
  }

  async patch(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'PATCH', url, body: data });
  }
}