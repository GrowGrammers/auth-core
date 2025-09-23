// HTTP 클라이언트 인터페이스

// JSON 본문 타입 정의
export type JsonBody = Record<string, unknown> | unknown[];

// HTTP 요청 설정 인터페이스
export interface HttpRequestConfig {
  url: string; // 추가: URL 정보 명시
  method: string;
  headers?: Record<string, string>;
  body?: JsonBody | FormData | Blob | ArrayBuffer | ArrayBufferView | undefined;
  timeout?: number;
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
}

export interface HttpClient {
  request(config: HttpRequestConfig): Promise<HttpResponse>;
} 