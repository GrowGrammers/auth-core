import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

// Helpers
function isFormData(v: any): v is FormData {
  return typeof FormData !== 'undefined' && v instanceof FormData;
}
function isBlob(v: any): v is Blob {
  return typeof Blob !== 'undefined' && v instanceof Blob;
}
function isArrayBufferLike(v: any): v is ArrayBuffer | ArrayBufferView {
  return v instanceof ArrayBuffer || ArrayBuffer.isView(v);
}
function isBodylessMethod(m?: string) {
  const method = (m ?? 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
}

/**
 * body는 항상 "객체(object/array)만" 허용
 * - object/array  → JSON.stringify 1회 + application/json
 * - FormData/Blob/ArrayBuffer → 그대로 전송(컨텐트 타입 자동/존중)
 * - 그 외(string/number/boolean 등) → 예외 throw
 */
function normalizeBody(body: any): { payload: BodyInit | undefined; contentType: string | null } {
  if (body == null) return { payload: undefined, contentType: null };

  if (isFormData(body)) return { payload: body, contentType: null };
  if (isBlob(body)) return { payload: body, contentType: body.type || null };
  if (isArrayBufferLike(body)) return { payload: (body as any), contentType: null };

  if (typeof body === 'object') {
    // 객체/배열만 허용
    return { payload: JSON.stringify(body), contentType: 'application/json' };
  }

  // 여기 오면 FE 규칙 위반
  throw new Error(
    'HttpClient: Request body must be an object (or FormData/Blob/ArrayBuffer). ' +
    'Do NOT pass stringified JSON or primitives. Pass a plain object and the client will serialize it.'
  );
}

export class RealHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    try {
      const { method = 'GET', url, headers = {}, body, timeout = 10000 } = config;

      // GET/HEAD는 바디 금지
      const skipBody = isBodylessMethod(method);
      const { payload, contentType } = skipBody ? { payload: undefined, contentType: null } : normalizeBody(body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 헤더 구성: 사용자가 넘긴 헤더 우선권 보장
      const finalHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...headers,
      };
      if (contentType && !('Content-Type' in Object.keys(headers).reduce((a, k) => ({ ...a, [k.toLowerCase()]: headers[k] }), {} as any))) {
        // 사용자가 Content-Type을 명시하지 않았다면 기본 세팅
        finalHeaders['Content-Type'] = contentType;
      }

      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
        credentials: 'include', // 쿠키 기반 인증을 위해 자격 증명 포함
      });

      clearTimeout(timeoutId);

      // 응답 파싱: JSON 우선 → 텍스트 폴백
      const data = await response.json().catch(async () => {
        const txt = await response.text().catch(() => '');
        return txt ? { raw: txt } : null;
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        json: async () => data,
        text: async () => (typeof data === 'string' ? data : JSON.stringify(data))
      };
    } catch (error) {
      // 네트워크/타임아웃/규칙 위반 등
      return {
        ok: false,
        status: 0,
        statusText: 'Error',
        headers: {},
        json: async () => ({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
        text: async () => (error instanceof Error ? error.message : '알 수 없는 오류')
      };
    }
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
