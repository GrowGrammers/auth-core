import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// 실제 HTTP 요청을 보내는 HttpClient 구현
export class RealHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    try {
      const { method = 'GET', url, headers = {}, body, timeout = 10000 } = config;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        json: async () => data,
        text: async () => JSON.stringify(data)
      };
      
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: 'Error',
        headers: {},
        json: async () => ({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
        text: async () => error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  async get<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'POST', url, body: data });
  }

  async put<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'PUT', url, body: data });
  }

  async delete<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url' | 'body'>): Promise<HttpResponse> {
    return this.request({ ...config, method: 'PATCH', url, body: data });
  }
}
