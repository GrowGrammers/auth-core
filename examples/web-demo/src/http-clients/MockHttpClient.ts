import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// 간단한 모킹 HTTP 클라이언트 - MSW 없이도 API 응답을 모킹
export class MockHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const { method = 'GET', url, body } = config;
    
    // URL에 따른 모킹 응답
    if (url.includes('/api/auth/email/request-verification') && method === 'POST') {
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
    
    if (url.includes('/api/auth/email/login') && method === 'POST') {
      // 요청 본문에서 verificationCode 확인
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
      const verificationCode = requestBody?.verificationCode;
      
      // 잘못된 인증번호인 경우 실패 응답
      if (verificationCode === '999999') {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          json: async () => ({
            success: false,
            message: '잘못된 인증번호입니다.',
            error: 'INVALID_VERIFICATION_CODE'
          }),
          text: async () => '{"success":false,"message":"잘못된 인증번호입니다.","error":"INVALID_VERIFICATION_CODE"}'
        };
      }
      
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
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
        }),
        text: async () => 'mock login response'
      };
    }
    
    if (url.includes('/api/auth/validate-token') && method === 'GET') {
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
    
    if (url.includes('/api/auth/user-info') && method === 'GET') {
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
    
    if (url.includes('/api/auth/email/refresh') && method === 'POST') {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        json: async () => ({
          success: true,
          message: '토큰 갱신에 성공했습니다.',
          data: {
            accessToken: 'new-mock-access-token-789',
            refreshToken: 'new-mock-refresh-token-012',
            expiresAt: Date.now() + 3600000 // 1시간 후 만료
          }
        }),
        text: async () => 'mock refresh response'
      };
    }
    
    if (url.includes('/api/auth/email/logout') && method === 'POST') {
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
    
    if (url.includes('/api/health') && method === 'GET') {
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
