import { HttpClient, HttpRequestConfig, HttpResponse } from '../../src/network/interfaces/HttpClient';

export class FakeHttpClient implements HttpClient {
  private mockResponses: Map<string, any> = new Map();
  private requestLog: HttpRequestConfig[] = [];

  // 테스트용 모의 응답 설정
  setMockResponse(url: string, method: string, response: any) {
    const key = `${method}:${url}`;
    this.mockResponses.set(key, response);
  }

  // 요청 로그 조회
  getRequestLog(): HttpRequestConfig[] {
    return [...this.requestLog];
  }

  // 로그 초기화
  clearRequestLog() {
    this.requestLog = [];
  }

  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    this.requestLog.push(config);
    
    const key = `${config.method}:${config.url}`;
    const mockResponse = this.mockResponses.get(key);
    if (mockResponse) {
      return mockResponse;
    }

    // 기본 응답
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      json: async () => ({}),
      text: async () => '',
    };
  }

  // 테스트 헬퍼 메서드들
  reset() {
    this.mockResponses.clear();
    this.requestLog = [];
  }

  setDefaultResponse(response: any) {
    this.mockResponses.set('default', response);
  }
}
