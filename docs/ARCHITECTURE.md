# Auth Core 아키텍처 문서

## 📋 목차

1. [핵심 아키텍처](#핵심-아키텍처)
2. [모듈 구조](#모듈-구조)
3. [데이터 흐름](#데이터-흐름)
4. [설계 원칙](#설계-원칙)
5. [확장성](#확장성)
6. [테스트 아키텍처](#테스트-아키텍처)

## 핵심 아키텍처

### 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Core (공통 모듈)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   AuthManager   │  │  AuthProvider   │  │ TokenStore  │ │
│  │  (중앙 제어)     │  │   (인터페이스)   │  │ (인터페이스) │ │
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
│  │AuthWebModule│  │  mobile-app  │  │AuthBackend  │        │
│  │             │  │             │  │  Service    │        │
│  │FetchHttpClient│  │AxiosHttpClient│  │SpringHttpClient│        │
│  │WebTokenStore │  │MobileTokenStore│  │ServerTokenStore│        │
│  │React 컴포넌트 │  │RN 컴포넌트   │  │Spring 미들웨어│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 내부 데이터 흐름

```
서비스 레이어 (외부)
    ↓ (AuthManager 인스턴스 생성 + 의존성 주입)
AuthManager.ts (중앙 제어)
    ↓ (의존성 주입)
Provider (EmailAuthProvider/GoogleAuthProvider)
    ↓ (API 호출)
Network Layer (emailAuthApi.ts/googleAuthApi.ts)
    ↓ (HTTP 요청)
실제 서버 API
```

## 모듈 구조

### 1. AuthManager (핵심 제어 모듈)

```typescript
export class AuthManager {
  private provider: AuthProvider;    // 인증 제공자 (Strategy Pattern)
  private tokenStore: TokenStore;    // 토큰 저장소 (Interface)

  constructor(config: AuthManagerConfig) {
    // 의존성 주입을 통한 플랫폼 독립성 확보
    this.provider = this.createProvider(config.providerType, config.apiConfig, config.httpClient);
    this.tokenStore = config.tokenStore || this.createTokenStoreFromType(config.tokenStoreType);
  }

  // 인증 플로우 제어 메서드들
  async login(request: LoginRequest): Promise<LoginApiResponse>
  async logout(request: LogoutRequest): Promise<LogoutApiResponse>
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse>
  async getToken(): Promise<GetTokenResponse>
  async isAuthenticated(): Promise<IsAuthenticatedApiResponse>
  async clear(): Promise<ClearResponse>
  async validateCurrentToken(): Promise<TokenValidationApiResponse>
}
```

**책임**: 인증 플로우의 중앙 제어, Provider와 TokenStore 조율

### 2. Provider (인증 제공자)

```typescript
// 인터페이스 분리 원칙 적용
export interface ILoginProvider {
  login(request: LoginRequest): Promise<LoginApiResponse>
  logout(request: LogoutRequest): Promise<LogoutApiResponse>
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenApiResponse>
  validateToken(token: Token): Promise<TokenValidationApiResponse>
  getUserInfo(token: Token): Promise<UserInfoApiResponse>
}

export interface IEmailVerifiable {
  requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse>
}

// 유니온 타입으로 하위 호환성 보장
export type AuthProvider = ILoginProvider | (ILoginProvider & IEmailVerifiable);
```

**구현체**:
- `EmailAuthProvider`: 이메일 인증 구현
- `GoogleAuthProvider`: 구글 인증 구현

### 3. Network Layer (API 호출)

```typescript
// 플랫폼 독립적인 HTTP 클라이언트 인터페이스
export interface HttpClient {
  request(config: HttpRequestConfig): Promise<HttpResponse>;
}

// API 호출 함수들
export async function loginByEmail(
  httpClient: HttpClient,
  config: ApiConfig,
  request: LoginRequest
): Promise<LoginApiResponse>
```

**책임**: 실제 HTTP 통신 처리, 에러 핸들링, 응답 변환

### 4. Storage (토큰 저장소)

```typescript
export interface TokenStore {
  saveToken(token: Token): Promise<SaveTokenResponse>;
  getToken(): Promise<GetTokenResponse>;
  removeToken(): Promise<RemoveTokenResponse>;
  hasToken(): Promise<HasTokenResponse>;
  isTokenExpired(): Promise<IsTokenExpiredResponse>;
  clear(): Promise<ClearResponse>;
}

// 응답 타입 정의
type SaveTokenResponse = SuccessResponse<null> | ErrorResponse;
type GetTokenResponse = SuccessResponse<Token | null> | ErrorResponse;
type RemoveTokenResponse = SuccessResponse<null> | ErrorResponse;
type HasTokenResponse = SuccessResponse<boolean> | ErrorResponse;
type IsTokenExpiredResponse = SuccessResponse<boolean> | ErrorResponse;
type ClearResponse = SuccessResponse<null> | ErrorResponse;
```

**책임**: 토큰의 안전한 저장, 조회, 삭제

### 5. Factory (객체 생성)

```typescript
// Factory Pattern으로 객체 생성 책임 분리
export function createAuthProvider(
  type: AuthProviderType,
  config: AuthProviderConfig,
  httpClient: HttpClient,
  apiConfig: ApiConfig
): AuthProviderFactoryResult

export function createAuthManager(
  config: AuthManagerConfig,
  httpClient: HttpClient,
  tokenStoreType?: TokenStoreType
): AuthManager

export function createTokenStore(
  type: TokenStoreType
): TokenStoreFactoryResult
```

**책임**: 복잡한 객체 생성 로직 캡슐화, 타입 안전성 보장

### 6. Shared Utils (공통 유틸리티)

```typescript
// 응답 생성 헬퍼 함수들
export function createSuccessResponse<T>(message: string, data: T): SuccessResponse<T>
export function createErrorResponse(error: string, message?: string): ErrorResponse
export function createErrorResponseFromException(error: unknown, defaultMessage: string): ErrorResponse

// 전용 에러 응답 함수들
export function createTokenValidationErrorResponse(reason?: string): ErrorResponse
export function createUserInfoErrorResponse(reason?: string): ErrorResponse
export function createNetworkErrorResponse(): ErrorResponse
export function createValidationErrorResponse(field: string): ErrorResponse
export function createTimeoutErrorResponse(): ErrorResponse
export function createServerErrorResponse(statusCode: number): ErrorResponse
```

**책임**: 일관된 응답 구조 생성, 에러 처리 표준화

## 데이터 흐름

### 1. 로그인 플로우

```typescript
// 1. 서비스에서 AuthManager 생성 (의존성 주입)
const authManager = new AuthManager({
  providerType: 'email',
  apiConfig: { /* API 설정 */ },
  httpClient: myHttpClient,  // ← 필수! 외부에서 주입
  tokenStoreType: 'web'      // 또는 직접 TokenStore 인스턴스 제공
});

// 2. 로그인 요청
const result = await authManager.login({
  provider: 'email',
  email: 'user@example.com',
  verificationCode: '123456'
});

// 3. 내부 처리 흐름
// AuthManager → EmailAuthProvider → emailAuthApi → 실제 서버
// 성공 시: 서버 응답 → 토큰 생성 → TokenStore에 저장
```

### 2. 토큰 검증 플로우

```typescript
// 1. 토큰 검증 요청
const validationResult = await authManager.validateCurrentToken();

// 2. 내부 처리 흐름
// TokenStore에서 토큰 조회 → 만료 확인 → Provider를 통한 서버 검증
```

### 3. 이메일 인증 플로우

```typescript
// 1. 이메일 인증 요청
const verificationResult = await authManager.requestEmailVerification({ 
  email: 'user@example.com' 
});

// 2. 내부 처리 흐름
// 타입 가드로 IEmailVerifiable 확인 → Provider → Network Layer → 서버
```

## 설계 원칙

### 1. 의존성 주입 (Dependency Injection)

```typescript
// 플랫폼별 구현체를 외부에서 주입
export interface AuthManagerConfig {
  providerType: 'email' | 'google';
  apiConfig: ApiConfig;
  httpClient: HttpClient;  // 필수 주입 - 플랫폼별 HTTP 클라이언트
  tokenStore?: TokenStore; // 선택적 주입 - 직접 TokenStore 인스턴스
  tokenStoreType?: 'web' | 'mobile' | 'fake'; // 선택적 주입 - 타입으로 팩토리 생성
}
```

**장점**: 
- 플랫폼 독립성: 브라우저, Node.js, React Native 등 모든 환경에서 사용 가능
- 테스트 용이성: Mock HTTP 클라이언트 주입으로 단위 테스트 가능
- 런타임 교체 가능: 필요에 따라 다른 HTTP 클라이언트로 교체 가능

### 2. 인터페이스 분리 (Interface Segregation)

```typescript
// 기능별 인터페이스 분리
interface ILoginProvider { /* 로그인 관련 */ }
interface IEmailVerifiable { /* 이메일 인증 관련 */ }
interface HttpClient { /* HTTP 통신 */ }
interface TokenStore { /* 토큰 저장 */ }
```

**장점**: 필요한 기능만 구현, 확장성 향상

### 3. 설정 기반 설계 (Configuration-Driven)

```typescript
export interface ApiConfig {
  baseUrl: string;
  endpoints: ApiEndpoints;
  timeout?: number;
  retryCount?: number;
}
```

**장점**: 환경별 설정 분리, 유연한 API 엔드포인트 관리

### 4. 단일 책임 원칙 (Single Responsibility)

- `AuthManager`: 인증 플로우 제어
- `EmailAuthProvider`: 이메일 인증 로직
- `TokenStore`: 토큰 저장/관리
- `HttpClient`: HTTP 통신
- `Factory`: 객체 생성 로직
- `Shared Utils`: 응답 생성 및 에러 처리

### 5. 개방-폐쇄 원칙 (Open-Closed)

```typescript
// 새로운 Provider 추가 시 기존 코드 수정 없이 확장
export function createAuthProvider(type: AuthProviderType, ...): AuthProviderFactoryResult {
  switch (type) {
    case 'email': return new EmailAuthProvider(...);
    case 'google': return new GoogleAuthProvider(...);
    case 'facebook': return new FacebookAuthProvider(...); // 새로 추가
  }
}
```

### 6. 타입 안전성 (Type Safety)

```typescript
// 제네릭을 활용한 타입 안전성
protected createResponse<T extends BaseResponse>(
  success: boolean, 
  error?: string, 
  errorCode?: string,
  additionalData?: Partial<T>
): T

// 타입 가드를 활용한 런타임 타입 검증
private isEmailVerifiable(provider: AuthProvider): provider is AuthProvider & IEmailVerifiable {
  return 'requestEmailVerification' in provider;
}

// 팩토리 결과의 타입 안전성
if (isAuthProviderFactoryError(result)) {
  throw new Error(result.message);
}
return result; // 여기서부터 result는 AuthProvider 타입으로 안전하게 좁혀짐
```

## 확장성

### 1. 새로운 인증 방식 추가

```typescript
// 1. 새로운 Provider 구현
export class FacebookAuthProvider implements ILoginProvider {
  // Facebook 로그인 구현
}

// 2. Factory에 추가
export function createAuthProvider(type: AuthProviderType, ...): AuthProviderFactoryResult {
  switch (type) {
    case 'facebook': return new FacebookAuthProvider(...);
  }
}

// 3. 타입 정의 업데이트
export type AuthProviderType = 'email' | 'google' | 'facebook';
```

### 2. 새로운 플랫폼 추가

```typescript
// 1. 플랫폼별 HttpClient 구현
class DesktopHttpClient implements HttpClient {
  // 데스크톱 앱용 HTTP 클라이언트
}

// 2. 플랫폼별 TokenStore 구현
const DesktopTokenStore: TokenStore = {
  // 데스크톱 앱용 토큰 저장소
};

// 3. 서비스에서 사용
const authManager = new AuthManager({
  providerType: 'email',
  apiConfig: desktopApiConfig,
  httpClient: new DesktopHttpClient(),  // ← 플랫폼별 HTTP 클라이언트 주입
  tokenStore: DesktopTokenStore         // ← 플랫폼별 토큰 저장소 주입
});
```

### 3. 새로운 기능 추가

```typescript
// 1. 새로운 인터페이스 정의
interface IBiometricAuth {
  authenticateWithBiometric(): Promise<boolean>;
}

// 2. Provider에 구현
export class EmailAuthProvider implements ILoginProvider, IEmailVerifiable, IBiometricAuth {
  async authenticateWithBiometric(): Promise<boolean> {
    // 생체 인증 구현
  }
}

// 3. AuthManager에 메서드 추가
export class AuthManager {
  async authenticateWithBiometric(): Promise<boolean> {
    if (this.isBiometricAuth(this.provider)) {
      return await this.provider.authenticateWithBiometric();
    }
    return false;
  }
}
```

## 테스트 아키텍처

### 1. 테스트 구조

```
test/
├── unit/                     # 단위 테스트
│   ├── auth-manager.test.ts # AuthManager 단위 테스트
│   └── setup/
│       └── unit.setup.ts    # 단위 테스트 설정
├── integration/              # 통합 테스트
│   ├── auth-integration-tests.ts # 전체 인증 플로우 테스트
│   └── setup/
│       ├── integration.setup.ts  # 통합 테스트 설정
│       ├── msw.handlers.ts       # MSW 핸들러
│       └── msw.server.ts         # MSW 서버 설정
├── mocks/                    # Mock 객체들
│   ├── FakeAuthProvider.ts   # 가짜 인증 제공자
│   ├── FakeHttpClient.ts     # 가짜 HTTP 클라이언트
│   ├── InMemoryTokenStore.ts # 메모리 토큰 저장소
│   └── MSWHttpClient.ts      # MSW 기반 HTTP 클라이언트
└── utils/                    # 테스트 유틸리티
    └── test-helpers.ts       # 테스트 헬퍼 함수들
```

### 2. 테스트 전략

#### 단위 테스트
- **목적**: 각 컴포넌트의 독립적인 기능 검증
- **범위**: AuthManager, Provider, TokenStore, Factory 등
- **Mock**: HTTP 클라이언트, 토큰 저장소를 Mock으로 대체
- **실행**: `npm run test:run`

#### 통합 테스트
- **목적**: 전체 인증 플로우 시나리오 검증
- **범위**: 로그인 → 토큰 검증 → 사용자 정보 조회 → 로그아웃
- **환경**: MSW를 사용한 API 모킹
- **실행**: `npm run integration:msw`

#### 웹 데모 테스트
- **목적**: 실제 브라우저 환경에서의 동작 확인
- **범위**: MSW 모킹, 실제 HTTP 클라이언트, Mock 클라이언트
- **환경**: Vite + TypeScript + MSW
- **실행**: `cd examples/web-demo && npm run dev`

### 3. 테스트 환경 설정

#### MSW (Mock Service Worker)
```typescript
// API 응답 모킹
export const handlers = [
  rest.post('/api/v1/auth/members/email-login', (req, res, ctx) => {
    return res(
      ctx.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com' }
      })
    );
  })
];
```

#### 테스트 설정
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup/unit.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

### 4. 테스트 커버리지

```bash
# 커버리지 확인
npm run test:coverage

# 전체 테스트 + 커버리지
npm run test:all:coverage
```

**목표**: 핵심 비즈니스 로직 90% 이상 커버리지 달성

## 결론

Auth Core는 다음과 같은 특징을 가진 **플랫폼 독립적인 인증 라이브러리**입니다:

### ✅ **아키텍처적 장점**
- **모듈화**: 각 컴포넌트가 명확한 책임을 가짐
- **확장성**: 새로운 인증 방식과 플랫폼 쉽게 추가
- **테스트 용이성**: 의존성 주입으로 Mock 구현체 사용 가능
- **타입 안전성**: TypeScript로 컴파일 타임 오류 검출 및 타입 가드 활용
- **일관된 응답 구조**: 모든 API가 동일한 응답 형태 사용
- **풍부한 유틸리티**: 응답 생성 및 에러 처리를 위한 헬퍼 함수들

### ✅ **팀 협업 장점**
- **공통 모듈**: 웹/모바일/백엔드에서 동일한 인증 로직 사용
- **인터페이스 기반**: 각 플랫폼 모듈에서 필요한 구현체만 제공
- **설정 분리**: 환경별 API 설정을 각 모듈에서 관리
- **의존성 주입**: HTTP 클라이언트와 토큰 저장소를 외부에서 주입받아 플랫폼 독립성 확보

### ✅ **유지보수성**
- **단일 책임**: 각 클래스가 하나의 명확한 역할
- **개방-폐쇄**: 새로운 기능 추가 시 기존 코드 수정 최소화
- **의존성 역전**: 구체적인 구현보다 추상화에 의존
- **완벽한 테스트 환경**: 단위/통합/웹 데모 테스트로 품질 보장

### ✅ **테스트 환경**
- **단위 테스트**: 각 컴포넌트 독립적 검증
- **통합 테스트**: 전체 인증 플로우 시나리오 검증
- **웹 데모**: 실제 브라우저 환경 동작 확인
- **MSW 모킹**: 백엔드 없이도 완전한 테스트 가능

다른 모듈들(AuthWebModule, mobile-app, AuthBackendService)에서 이 공통 모듈을 활용하여 각자의 플랫폼 특성에 맞는 인증 시스템을 구축할 수 있습니다. 