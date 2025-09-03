# Auth Core

**플랫폼 독립적인 인증 라이브러리**입니다. 웹, 모바일, 백엔드 등 모든 환경에서 동일한 인증 로직을 사용할 수 있도록 설계되었습니다.

 **팀 프로젝트 컨텍스트**: 이 모듈은 4개 모듈 중 하나인 **공통 클라이언트 모듈**입니다.
>  📁 **auth-core** ← 로그인 흐름의 클라이언트 공통 모듈 (TS 기반) ← **현재 모듈**  
>  📁 AuthWebModule ← 웹 특화 모듈 (리디렉션, 쿼리 파싱 등)  
>  📁 mobile-app ← 모바일 특화 모듈 (딥링크, SecureStorage 등)  
>  📁 AuthBackendService ← 백엔드 전용 로그인 모듈 (Java Spring 기반)

## 🏗️ 아키텍처 흐름

### 내부 흐름
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

### 외부 모듈과의 상호작용
```
AuthWebModule (웹 특화)
    ↓ (HTTP 클라이언트 + 토큰 저장소 주입)
Auth Core (공통 모듈)
    ↓ (API 요청)
AuthBackendService (백엔드)

mobile-app (모바일 특화)
    ↓ (HTTP 클라이언트 + 토큰 저장소 주입)
Auth Core (공통 모듈)
    ↓ (API 요청)
AuthBackendService (백엔드)
```

## 🚀 주요 특징

- **🔧 플랫폼 독립성**: HTTP 클라이언트와 토큰 저장소를 외부에서 주입받아 사용
- **⚙️ 설정 가능한 API**: 환경별 API 엔드포인트 설정 지원
- **🛡️ 타입 안전성**: TypeScript로 완전한 타입 지원 및 타입 가드 활용
- **📦 모듈화**: 필요한 기능만 선택적으로 사용 가능
- **🤝 공통 모듈**: 웹/모바일/백엔드 모듈에서 공통으로 사용하는 인증 로직
- **🏭 팩토리 패턴**: 객체 생성 로직을 팩토리로 분리하여 복잡성 감소
- **🔄 일관된 응답 구조**: 모든 API 메서드가 `{ success, data, message, error? }` 형태의 응답 구조 사용

## 📦 설치

```bash
npm install auth-core
```

## 🏗️ 프로젝트 구조

```
auth-core/
├── AuthManager.ts                # 인증 플로우 제어 (핵심)
├── providers/                    # 인증 제공자 (Strategy Pattern)
│   ├── implementations/
│   │   ├── EmailAuthProvider.ts # 이메일 로그인
│   │   └── GoogleAuthProvider.ts# 구글 로그인
│   └── interfaces/
├── network/                      # API 호출 로직
│   ├── emailAuthApi.ts          # 이메일 인증 API
│   ├── googleAuthApi.ts         # 구글 인증 API
│   └── interfaces/
├── storage/                      # 토큰 저장소 인터페이스
│   ├── implementations/          # 플랫폼별 구현체 (웹/모바일용)
│   └── FakeTokenStore.ts        # 테스트용 가짜 저장소
├── factories/                    # 객체 생성 (Factory Pattern)
│   ├── AuthManagerFactory.ts    # AuthManager 생성
│   ├── AuthProviderFactory.ts   # Provider 생성
│   └── TokenStoreFactory.ts     # TokenStore 생성
├── shared/                       # 공통 유틸리티
│   ├── types/                    # 타입 정의
│   └── utils/                    # 응답 생성 및 에러 처리 유틸리티
├── test/                         # 테스트 코드
│   ├── unit/                     # 단위 테스트
│   ├── integration/              # 통합 테스트
│   └── mocks/                    # 테스트용 Mock 객체들
├── examples/                     # 사용 예시
│   └── web-demo/                 # 웹 데모 애플리케이션
└── index.ts                      # 진입점 export
```

## 🎯 빠른 시작

### Google OAuth 설정

Google OAuth를 사용하려면 Google Cloud Console에서 설정이 필요합니다:

1. **Google Cloud Console에서 프로젝트 생성**
2. **OAuth 2.0 클라이언트 ID 생성**
3. **환경변수 설정**

```bash
# .env 파일에 추가
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_PROJECT_ID=your_google_project_id_here
```

4. **AuthManager 설정**

```typescript
import { AuthManager } from 'auth-core';

const authManager = new AuthManager({
  providerType: 'google',
  apiConfig: {
    apiBaseUrl: 'https://your-api.com',
    endpoints: {
      googleLogin: '/auth/google/login',
      googleLogout: '/auth/google/logout',
      googleRefresh: '/auth/google/refresh',
      // ... 기타 엔드포인트
    }
  },
  httpClient: new FetchHttpClient(),
  // Google 전용 설정
  provider: new GoogleAuthProvider({
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    timeout: 10000,
    retryCount: 3
  }, httpClient, apiConfig)
});
```

### 기본 사용법

```typescript
import { AuthManager } from 'auth-core';

// 1. HTTP 클라이언트 구현 (플랫폼별로 다름)
class FetchHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    // fetch 기반 구현
  }
}

// 2. AuthManager 인스턴스 생성
const authManager = new AuthManager({
  providerType: 'email',
  apiConfig: { /* API 설정 */ },
  httpClient: new FetchHttpClient(),
  tokenStoreType: 'web'
});

// 3. 기본 인증 플로우
await authManager.requestEmailVerification({ email: 'user@example.com' });
const result = await authManager.login({ email: 'user@example.com', verificationCode: '123456' });
```

**더 자세한 사용법은 [사용 가이드](docs/USAGE_GUIDE.md)를 참조하세요.**

## 📚 주요 기능

### 인증 플로우
- 이메일 인증 요청
- 로그인/로그아웃
- 토큰 검증 및 갱신
- 사용자 정보 조회

### 토큰 관리
- 토큰 저장/조회/삭제
- 토큰 만료 확인
- 자동 토큰 갱신

## 🔌 플랫폼별 구현

각 플랫폼 모듈(AuthWebModule, mobile-app)에서는 다음을 구현해야 합니다:

### HTTP 클라이언트 (필수)
```typescript
interface HttpClient {
  request(config: HttpRequestConfig): Promise<HttpResponse>;
}
```

**구현 예시**:
- **브라우저**: `fetch` 기반 클라이언트
- **Node.js**: `axios` 기반 클라이언트  
- **React Native**: `fetch` 또는 `axios` 기반 클라이언트

### 토큰 저장소 (선택)
```typescript
interface TokenStore {
  saveToken(token: Token): Promise<SaveTokenResponse>;
  getToken(): Promise<GetTokenResponse>;
  removeToken(): Promise<RemoveTokenResponse>;
  hasToken(): Promise<HasTokenResponse>;
  isTokenExpired(): Promise<IsTokenExpiredResponse>;
  clear(): Promise<ClearResponse>;
}
```

**구현 예시**:
- **웹**: `localStorage` 기반 저장소
- **모바일**: `SecureStore` 기반 저장소
- **백엔드**: 메모리 또는 Redis 기반 저장소

## 🛡️ 타입 안전성

이 모듈은 TypeScript의 타입 가드를 활용하여 런타임 안전성을 보장합니다:

### 타입 가드 함수들
- `isAuthProviderFactoryError()`: 인증 제공자 팩토리 에러 확인
- `isTokenStoreFactoryError()`: 토큰 저장소 팩토리 에러 확인
- `isFactorySuccess()`: 팩토리 성공 결과 확인
- `isFactoryError()`: 팩토리 에러 결과 확인

## 🔄 API 응답 구조

모든 API 메서드는 일관된 응답 구조를 사용합니다:

### 성공 응답
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}
```

### 에러 응답
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  data: null;
}
```

**구체적인 사용 예시는 [사용 가이드](docs/USAGE_GUIDE.md)를 참조하세요.**

## 🧪 테스트 환경

### 테스트 스크립트
```bash
# 단위 테스트
npm run test:run

# 통합 테스트 (로컬)
npm run integration:local

# 통합 테스트 (MSW 모킹)
npm run integration:msw

# 전체 테스트 (단위 + 통합)
npm run test:all

# 커버리지 포함 테스트
npm run test:all:coverage
```

### 테스트 구조
- **단위 테스트**: 각 컴포넌트의 독립적인 기능 테스트
- **통합 테스트**: 전체 인증 플로우 시나리오 테스트
- **웹 데모**: 실제 브라우저 환경에서의 동작 확인

## 🎨 설계 원칙

이 모듈은 다음과 같은 원칙들을 고려하여 설계되었습니다:

- **의존성 주입 (Dependency Injection)**: HTTP 클라이언트와 토큰 저장소를 외부에서 주입받아 플랫폼 독립성 확보
- **인터페이스 분리 (Interface Segregation)**: HttpClient, TokenStore, AuthProvider 인터페이스로 추상화
- **설정 기반 설계 (Configuration-Driven)**: ApiConfig로 환경별 API 엔드포인트 설정 분리
- **단일 책임 원칙 (Single Responsibility)**: 각 클래스가 하나의 책임만 가지도록 분리
- **개방-폐쇄 원칙 (Open-Closed)**: 새로운 인증 방식 추가 시 기존 코드 수정 없이 확장 가능
- **타입 안전성 (Type Safety)**: TypeScript 제네릭과 타입 가드를 활용한 안전한 타입 시스템

### 적용된 디자인 패턴

- **Strategy Pattern**: 다양한 인증 방식 (이메일, 구글)을 전략으로 구현
- **Factory Pattern**: AuthManager, Provider, TokenStore 생성 시 팩토리 사용
- **Template Method Pattern**: EmailAuthProvider의 createResponse 메서드로 공통 응답 생성 로직 추상화

## 📖 문서

- **[사용 가이드](docs/USAGE_GUIDE.md)**: 상세한 사용법과 예시
- **[아키텍처 문서](docs/ARCHITECTURE.md)**: 설계 원칙과 코드 흐름
