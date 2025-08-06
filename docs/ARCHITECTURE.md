# Auth Core 아키텍처 문서

## 📋 목차

1. [핵심 아키텍처](#핵심-아키텍처)
4. [모듈 구조](#모듈-구조)
5. [데이터 흐름](#데이터-흐름)
6. [설계 원칙](#설계-원칙)
7. [확장성](#확장성)


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
    ↓ (AuthManager 인스턴스 생성)
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
    this.tokenStore = config.tokenStore || this.createDefaultTokenStore();
  }

  // 인증 플로우 제어 메서드들
  async login(request: LoginRequest): Promise<LoginResponse>
  async logout(request: LogoutRequest): Promise<LogoutResponse>
  async requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse>
  async getToken(): Promise<Token | null>
  async validateCurrentToken(): Promise<boolean>
}
```

**책임**: 인증 플로우의 중앙 제어, Provider와 TokenStore 조율

### 2. Provider (인증 제공자)

```typescript
// 인터페이스 분리 원칙 적용
export interface ILoginProvider {
  login(request: LoginRequest): Promise<LoginResponse>
  logout(request: LogoutRequest): Promise<LogoutResponse>
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>
  validateToken(token: Token): Promise<boolean>
  getUserInfo(token: Token): Promise<UserInfo | null>
}

export interface IEmailVerifiable {
  requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse>
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
): Promise<ApiResponse<{ token: Token; userInfo: UserInfo }>>
```

**책임**: 실제 HTTP 통신 처리, 에러 핸들링, 응답 변환

### 4. Storage (토큰 저장소)

```typescript
export interface TokenStore {
  saveToken(token: Token): Promise<boolean>;
  getToken(): Promise<Token | null>;
  removeToken(): Promise<boolean>;
  hasToken(): Promise<boolean>;
  isTokenExpired(): Promise<boolean>;
  clear(): Promise<boolean>;
}
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
): AuthProvider

export function createAuthManager(
  config: AuthManagerConfig,
  httpClient: HttpClient,
  tokenStoreType?: TokenStoreType
): AuthManager
```

**책임**: 복잡한 객체 생성 로직 캡슐화

## 데이터 흐름

### 1. 로그인 플로우

```typescript
// 1. 서비스에서 AuthManager 생성
const authManager = new AuthManager({
  providerType: 'email',
  apiConfig: { /* API 설정 */ },
  httpClient: myHttpClient  // 플랫폼별 구현체 주입
});

// 2. 로그인 요청
const result = await authManager.login({
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
const isValid = await authManager.validateCurrentToken();

// 2. 내부 처리 흐름
// TokenStore에서 토큰 조회 → 만료 확인 → Provider를 통한 서버 검증
```

### 3. 이메일 인증 플로우

```typescript
// 1. 이메일 인증 요청
await authManager.requestEmailVerification({ 
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
  httpClient: HttpClient;  // 필수 주입
  tokenStore?: TokenStore; // 선택적 주입
}
```

**장점**: 플랫폼 독립성, 테스트 용이성, 런타임 교체 가능

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
  apiBaseUrl: string;
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

### 5. 개방-폐쇄 원칙 (Open-Closed)

```typescript
// 새로운 Provider 추가 시 기존 코드 수정 없이 확장
export function createAuthProvider(type: AuthProviderType, ...): AuthProvider {
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
```

## 확장성

### 1. 새로운 인증 방식 추가

```typescript
// 1. 새로운 Provider 구현
export class FacebookAuthProvider implements ILoginProvider {
  // Facebook 로그인 구현
}

// 2. Factory에 추가
export function createAuthProvider(type: AuthProviderType, ...): AuthProvider {
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
  httpClient: new DesktopHttpClient(),
  tokenStore: DesktopTokenStore
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

## 결론

Auth Core는 다음과 같은 특징을 가진 **플랫폼 독립적인 인증 라이브러리**입니다:

### ✅ **아키텍처적 장점**
- **모듈화**: 각 컴포넌트가 명확한 책임을 가짐
- **확장성**: 새로운 인증 방식과 플랫폼 쉽게 추가
- **테스트 용이성**: 의존성 주입으로 Mock 구현체 사용 가능
- **타입 안전성**: TypeScript로 컴파일 타임 오류 검출

### ✅ **팀 협업 장점**
- **공통 모듈**: 웹/모바일/백엔드에서 동일한 인증 로직 사용
- **인터페이스 기반**: 각 플랫폼 모듈에서 필요한 구현체만 제공
- **설정 분리**: 환경별 API 설정을 각 모듈에서 관리

### ✅ **유지보수성**
- **단일 책임**: 각 클래스가 하나의 명확한 역할
- **개방-폐쇄**: 새로운 기능 추가 시 기존 코드 수정 최소화
- **의존성 역전**: 구체적인 구현보다 추상화에 의존

다른 모듈들(AuthWebModule, mobile-app, AuthBackendService)에서 이 공통 모듈을 활용하여 각자의 플랫폼 특성에 맞는 인증 시스템을 구축할 수 있습니다. 