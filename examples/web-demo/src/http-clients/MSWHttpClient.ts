import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// MSW를 사용하는 HttpClient 구현체
export class MSWHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const { method = 'GET', url, body, headers = {} } = config;
    
    try {
      // 실제 fetch 요청 (MSW가 가로채서 모의 응답 제공)
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body, // 이미 JSON.stringify된 body를 그대로 사용
      });

      const responseData = await response.json();
      
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        text: async () => JSON.stringify(responseData),
        json: async () => responseData
      };
      
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        text: async () => error instanceof Error ? error.message : '알 수 없는 오류',
        json: async () => ({ 
          success: false, 
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          data: null,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      };
    }
  }
}
