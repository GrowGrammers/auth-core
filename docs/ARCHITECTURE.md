# Auth Core 아키텍처 문서

## 📋 목차

1. [개요](#개요)
2. [핵심 설계 원칙](#핵심-설계-원칙)
3. [아키텍처 개요](#아키텍처-개요)
4. [API 설정 시스템](#api-설정-시스템)
5. [플랫폼별 구현](#플랫폼별-구현)
6. [장점 및 특징](#장점-및-특징)

## 개요

Auth Core는 **플랫폼 독립적인 인증 라이브러리**입니다. 웹, 모바일, 백엔드 등 모든 환경에서 동일한 인증 로직을 사용할 수 있도록 설계되었습니다.

### 🎯 목표

- **재사용성**: 하나의 코드로 모든 플랫폼 지원
- **유지보수성**: 비즈니스 로직과 플랫폼 로직 분리
- **확장성**: 새로운 인증 방식과 플랫폼 쉽게 추가
- **테스트 용이성**: Mock 구현체로 쉬운 테스트

## 핵심 설계 원칙

### 1. 플랫폼 독립성 (Platform Independence)
- **전략**: 인터페이스 기반 설계로 플랫폼 의존성 제거
- **결과**: 어떤 플랫폼에서든 사용 가능한 순수 비즈니스 로직 모듈

### 2. 의존성 주입 (Dependency Injection)
- **전략**: 플랫폼별 구현체를 외부에서 주입받아 사용
- **장점**: 런타임에 구현체 교체 가능, 테스트 용이성 향상

### 3. 인터페이스 분리 (Interface Segregation)
- **HTTP 클라이언트**: `HttpClient` 인터페이스로 추상화
- **토큰 저장소**: `TokenStore` 인터페이스로 추상화
- **인증 제공자**: `AuthProvider` 인터페이스로 추상화

### 4. 설정 기반 설계 (Configuration-Driven Design)
- **API 엔드포인트**: `ApiConfig`로 설정화
- **환경별 설정**: 개발/스테이징/프로덕션 환경별 설정 분리

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Core (공통 모듈)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   AuthManager   │  │  AuthProvider   │  │ TokenStore  │ │
│  │  (비즈니스 로직) │  │   (인터페이스)   │  │ (인터페이스) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   HttpClient    │  │   ApiConfig     │  │   Factory   │ │
│  │   (인터페이스)   │  │   (설정 객체)    │  │   (팩토리)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    플랫폼별 모듈들                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 웹 프론트엔드 │  │   모바일 앱   │  │ 웹 백엔드    │        │
│  │             │  │             │  │             │        │
│  │FetchHttpClient│  │AxiosHttpClient│  │SpringHttpClient│        │
│  │WebTokenStore │  │MobileTokenStore│  │ServerTokenStore│        │
│  │React 컴포넌트 │  │RN 컴포넌트   │  │Spring 미들웨어│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 모듈 사용 예시

```typescript
// 1. 사용자가 AuthManager 생성 요청
const authManager = createAuthManager({
  providerType: 'email',
  tokenStoreType: 'web',
  apiConfig: getDefaultApiConfig('https://api.example.com'),
  httpClient: new FetchHttpClient(),
  tokenStoreRegistry: {
    web: WebTokenStore,
    mobile: MobileTokenStore,
    fake: FakeTokenStore
  }
});

// 2. AuthManagerFactory에서 처리
export function createAuthManager(options: AuthManagerOptions): AuthManager {
  // 2-1. HTTP 클라이언트 검증
  if (!options.httpClient) {
    throw new Error('HttpClient is required');
  }

  // 2-2. 토큰 저장소 생성
  const tokenStore = createTokenStore(
    options.tokenStoreType,
    options.tokenStoreRegistry
  );

  // 2-3. 인증 제공자 생성
  const provider = createAuthProvider(
    options.providerType,
    { /* 기본 설정 */ },
    options.httpClient,
    options.apiConfig
  );

  // 2-4. AuthManager 인스턴스 생성 및 반환
  return new AuthManager(provider, tokenStore);
}
```

### 2. 로그인 플로우

```typescript
// 1. 사용자가 로그인 요청
const result = await authManager.login({
  provider: 'email',
  email: 'user@example.com',
  verificationCode: '123456'
});

// 2. AuthManager에서 처리
async login(request: LoginRequest): Promise<LoginResponse> {
  // 2-1. 인증 제공자에게 로그인 요청
  const loginResponse = await this.provider.login(request);
  
  // 2-2. 로그인 성공 시 토큰 저장
  if (loginResponse.success && loginResponse.token) {
    await this.tokenStore.saveToken(loginResponse.token);
  }
  
  // 2-3. 응답 반환
  return loginResponse;
}

// 3. EmailAuthProvider에서 실제 API 호출
async login(request: LoginRequest): Promise<LoginResponse> {
  // 3-1. API 엔드포인트 구성
  const url = `${this.apiConfig.apiBaseUrl}${this.apiConfig.endpoints.login}`;
  
  // 3-2. HTTP 요청 수행
  const response = await this.httpClient.request({
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  // 3-3. 응답 처리 및 반환
  return this.handleLoginResponse(response);
}
```

### 3. 토큰 검증 플로우

```typescript
// 1. 사용자가 토큰 검증 요청
const isValid = await authManager.validateCurrentToken();

// 2. AuthManager에서 처리
async validateCurrentToken(): Promise<boolean> {
  // 2-1. 저장된 토큰 조회
  const token = await this.tokenStore.getToken();
  if (!token) return false;
  
  // 2-2. 토큰 만료 체크
  if (await this.tokenStore.isTokenExpired()) {
    return false;
  }
  
  // 2-3. 서버에 토큰 유효성 검증 요청
  return await this.provider.validateToken(token);
}
```

## API 설정 시스템

### 1. 기본 설정

```typescript
// types.ts에서 정의
export interface ApiEndpoints {
  requestVerification: string;
  login: string;
  logout: string;
  refresh: string;
  validate: string;
  me: string;
  health: string;
}

export interface ApiConfig {
  apiBaseUrl: string;
  endpoints: ApiEndpoints;
  timeout?: number;
  retryCount?: number;
}

// configUtils.ts에서 기본값 제공
export function getDefaultEndpoints(): ApiEndpoints {
  return {
    requestVerification: '/auth/request-verification',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    validate: '/auth/validate',
    me: '/auth/me',
    health: '/health'
  };
}

export function getDefaultApiConfig(apiBaseUrl: string): ApiConfig {
  return {
    apiBaseUrl,
    endpoints: getDefaultEndpoints(),
    timeout: 10000,
    retryCount: 3
  };
}
```

### 2. 설정 병합

```typescript
export function mergeApiConfig(
  baseConfig: ApiConfig,
  customEndpoints?: Partial<ApiEndpoints>
): ApiConfig {
  return {
    ...baseConfig,
    endpoints: {
      ...baseConfig.endpoints,
      ...customEndpoints
    }
  };
}

// 사용 예시
const baseConfig = getDefaultApiConfig('https://api.example.com');
const customConfig = mergeApiConfig(baseConfig, {
  endpoints: {
    login: '/custom/auth/login',
    logout: '/custom/auth/logout'
  },
  timeout: 15000
});
```

### 3. 환경별 설정

```typescript
// 환경별 설정 예시
const getEnvironmentConfig = (env: string): ApiConfig => {
  const baseConfig = getDefaultApiConfig(
    env === 'production' 
      ? 'https://api.production.com'
      : 'https://api.staging.com'
  );
  
  if (env === 'development') {
    return mergeApiConfig(baseConfig, {
      endpoints: {
        login: '/dev/auth/login'
      },
      timeout: 30000 // 개발 환경에서는 더 긴 타임아웃
    });
  }
  
  return baseConfig;
};
```

## 플랫폼별 구현

### 웹 프론트엔드

```typescript
// HTTP 클라이언트 구현
class FetchHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      json: () => response.json(),
      text: () => response.text()
    };
  }
}

// 토큰 저장소 구현
const WebTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      localStorage.setItem('accessToken', token.accessToken);
      if (token.refreshToken) {
        localStorage.setItem('refreshToken', token.refreshToken);
      }
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async getToken(): Promise<Token | null> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;
    
    const refreshToken = localStorage.getItem('refreshToken') || undefined;
    return { accessToken, refreshToken };
  },
  
  // ... 기타 메서드들
};
```

### 모바일 앱 (React Native)

```typescript
// HTTP 클라이언트 구현
import axios from 'axios';

class AxiosHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    try {
      const response = await axios({
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.body,
        timeout: config.timeout
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data))
      };
    } catch (error) {
      // 에러 처리
      throw error;
    }
  }
}

// 토큰 저장소 구현
import * as SecureStore from 'expo-secure-store';

const MobileTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      await SecureStore.setItemAsync('accessToken', token.accessToken);
      if (token.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', token.refreshToken);
      }
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async getToken(): Promise<Token | null> {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (!accessToken) return null;
      
      const refreshToken = await SecureStore.getItemAsync('refreshToken') || undefined;
      return { accessToken, refreshToken };
    } catch (error) {
      return null;
    }
  },
  
  // ... 기타 메서드들
};
```

## 장점 및 특징

### 1. 재사용성
- **하나의 Auth Core로 모든 플랫폼 지원**
- 새로운 플랫폼 추가 시 구현체만 제공하면 됨
- 비즈니스 로직은 공통으로 사용

### 2. 테스트 용이성
- **플랫폼 의존성 제거로 단위 테스트 쉬움**
- `FakeTokenStore`, `MockHttpClient` 사용 가능
- 실제 네트워크나 저장소 없이도 테스트 가능

### 3. 유지보수성
- **비즈니스 로직과 플랫폼 로직 분리**
- 인증 로직 변경 시 Auth Core만 수정
- 각 플랫폼의 특성에 맞는 구현체 사용

### 4. 확장성
- **새로운 인증 방식 추가 시 `AuthProvider` 구현만**
- 새로운 토큰 저장 방식 추가 시 `TokenStore` 구현만
- 설정 기반으로 다양한 환경 지원

### 5. 타입 안전성
- **TypeScript로 완전한 타입 지원**
- 컴파일 타임에 오류 검출
- IDE 자동완성 지원

### 6. 설정 유연성
- **환경별 API 설정 분리**
- 커스텀 엔드포인트 지원
- 타임아웃, 재시도 등 세부 설정 가능

## 결론

Auth Core는 다음과 같은 특징을 가진 **플랫폼 독립적인 인증 라이브러리**입니다:

- ✅ **플랫폼 독립적**: 어떤 환경에서든 사용 가능
- ✅ **순수 비즈니스 로직**: 인증 플로우, 토큰 관리 로직만 포함
- ✅ **인터페이스 기반**: 구체적 구현은 각 플랫폼에서 제공
- ✅ **의존성 주입**: 런타임에 구현체 교체 가능
- ✅ **설정 가능**: API 엔드포인트 등 환경별 설정 가능
- ✅ **타입 안전성**: TypeScript로 완전한 타입 지원

이제 웹 프론트엔드, 모바일 앱, 웹 백엔드에서 동일한 인증 로직을 사용하면서도 각자의 플랫폼 특성에 맞는 구현체를 사용할 수 있습니다. 