import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// MSW를 사용하는 HttpClient 구현체
export class MSWHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const { method = 'GET', url, body, headers = {} } = config;

    // ✅ body 직렬화 보장
    const isBodyAllowed = !['GET', 'HEAD'].includes(method.toUpperCase());
    const serializedBody =
      body == null
        ? undefined
        : (typeof body === 'string' ||
           body instanceof FormData ||
           body instanceof Blob ||
           body instanceof URLSearchParams ||
           // ReadableStream 타입가드 느슨히
           (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream))
            ? body
            : JSON.stringify(body);
    
    try {
      // FormData/Blob인 경우 Content-Type을 자동으로 설정하도록 함
      const isFormLike = body instanceof FormData || body instanceof Blob;
      const baseHeaders = isFormLike ? headers : { 'Content-Type': 'application/json', ...headers };
      
      // 실제 fetch 요청 (MSW가 가로채서 모의 응답 제공)
      const response = await fetch(url, {
        method,
        headers: baseHeaders,
        body: isBodyAllowed ? serializedBody : undefined, // GET/HEAD엔 body 금지
        credentials: 'include', // 쿠키 기반 인증을 위해 자격 증명 포함
      });

      const responseData = await response.json();
      
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        text: async () => responseData,
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
