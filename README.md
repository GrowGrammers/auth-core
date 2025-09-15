# Auth Core

**플랫폼 독립적인 인증 라이브러리**입니다. 웹, 모바일, 백엔드 등 모든 환경에서 동일한 인증 로직을 사용할 수 있도록 설계되었습니다.


## TL;DR

1. `AuthManager` 하나로 이메일/OAuth 로그인 흐름 제어
2. **플랫폼 독립**: `HttpClient`, `TokenStore`를 주입해서 웹/모바일/서버 어디서나 동작
3. **React Native 지원**: 네이티브 브릿지를 통한 M2(A) 패턴 지원
4. **일관 응답 규격** `{ success, data, message, error? }`


## 왜 필요한가?

* 실제 서비스는 **웹/모바일/백엔드**가 나뉘지만, 인증 로직은 대부분 동일합니다.
* 플랫폼별 네트워크/저장 방식 차이로 코드가 중복되기 쉽습니다.
* `auth-core`는 **전략/팩토리 패턴** 기반의 추상화를 통해 **공통 로직은 하나로**, **플랫폼 특화는 주입**으로 분리합니다.


## 무엇이 아닌가?

* 특정 프레임워크에 고정된 인증 SDK가 아닙니다.
* UI 컴포넌트나 라우팅 같은 **프론트 UI 레이어**는 포함하지 않습니다. (웹/모바일 예제는 별도 모듈에서 제공)


## 아키텍처 한눈에 보기

```
서비스 코드(웹/모바일/백엔드)
        │  (AuthManager 생성, 의존성 주입)
        ▼
   AuthManager  ──────────────┐
        │                     │
        ▼                     ▼
 AuthProvider(Email/Google)   TokenStore(웹/모바일/RN)
        │                     │
        ▼                     ▼
   Network Layer (API 호출)   ReactNativeBridge(RN전용)
        │                     │
        ▼                     ▼
    실제 Auth Backend      Native Module
```

### 모듈 관계

* **auth-core** ← (공통 인증 로직, TypeScript)
* **AuthWebModule** ← 웹 특화(리디렉션/쿼리 파싱 등) → `HttpClient`/`TokenStore` 주입
* **mobile-app** ← 모바일 특화(딥링크, SecureStorage 등) → `HttpClient`/`TokenStore` 주입
* **React Native App** ← RN 특화(네이티브 브릿지, M2A 패턴) → `ReactNativeBridge` 주입
* **AuthBackendService** ← 서버 모듈(Java/Spring)

---

## 주요 기능

### 공통 인증 플로우
* 이메일 인증 요청/확인, 로그인/로그아웃
* OAuth 로그인/로그아웃웃
* 토큰 검증/갱신, 자동 만료 체크
* **응답 규격 표준화**: `SuccessResponse<T>` / `ErrorResponse`
* **타입 안전성**: TypeScript 제네릭 + 타입가드

### React Native 전용 기능
* 네이티브 브릿지 상태 확인
* 보호된 API 대리호출
* 세션 정보 조회

---

## 사용 시나리오

1. **웹 앱**: `fetch` 기반 `HttpClient` + `localStorage` 기반 `TokenStore`
2. **React Native**: 네이티브 브릿지 기반 `HttpClient` + 가상 `TokenStore`

---

## 설치

```bash
npm install auth-core
# 또는
yarn add auth-core
```


## 빠른 시작

### 웹 환경

```ts
import { AuthManager } from 'auth-core';

// 1. HTTP 클라이언트 구현 (플랫폼별로 다름)
class FetchHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    // fetch 기반 구현
  }
}

// 2. AuthManager 생성
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

### React Native 환경

```ts
import { AuthManager } from 'auth-core';

// 1. React Native Bridge 구현 (네이티브 모듈과 연동)
const nativeBridge: ReactNativeBridge = {
  async startOAuth(provider) { /* 네이티브 OAuth 실행 */ },
  async getSession() { /* 네이티브에서 세션 정보 조회 */ },
  async signOut() { /* 네이티브 로그아웃 */ },
  async callWithAuth(request) { /* 네이티브에서 보호된 API 대리호출 */ },
  // 이벤트 리스너 메서드들...
};

// 2. AuthManager 생성 (React Native 전용 설정)
const authManager = new AuthManager({
  providerType: 'google',
  apiConfig: { /* API 설정 */ },
  httpClient: new ReactNativeHttpClient(nativeBridge), // Bridge 기반 HTTP 클라이언트
  platform: 'react-native',
  tokenStoreType: 'react-native',
  nativeBridge: nativeBridge,
  providerConfig: { googleClientId: 'your-google-client-id' }
});

// 3. React Native 전용 인증 플로우 (M2A 패턴)
await authManager.startNativeOAuth('google');  // 네이티브 OAuth 시작
const session = await authManager.getCurrentSession();  // 세션 정보 조회
const apiResponse = await authManager.callProtectedAPI({  // 보호된 API 대리호출
  url: '/api/user/profile',
  method: 'GET'
});
```

**더 자세한 사용법은 [사용 가이드](docs/USAGE_GUIDE.md)를 참조하세요.**



## 프로젝트 구조

```
auth-core/
├─ AuthManager.ts                 # 인증 플로우 제어(핵심)
├─ providers/                     # 전략 패턴(Email/Google 등)
│  ├─ implementations/
│  │  ├─ EmailAuthProvider.ts
│  │  └─ GoogleAuthProvider.ts
│  └─ interfaces/
├─ network/                       # API 호출 레이어
│  ├─ emailAuthApi.ts
│  ├─ googleAuthApi.ts
│  └─ interfaces/
├─ storage/                       # 토큰 저장소 인터페이스/구현체
│  ├─ implementations/            # 플랫폼별(web/react-native)
│  │  ├─ WebTokenStore.ts
│  │  └─ ReactNativeTokenStore.ts
│  ├─ interfaces/
│  │  └─ ReactNativeBridge.ts     # RN 브릿지 인터페이스
│  └─ FakeTokenStore.ts           # 테스트용
├─ factories/                     # Factory 패턴으로 생성 책임 분리
│  ├─ AuthManagerFactory.ts
│  ├─ AuthProviderFactory.ts
│  └─ TokenStoreFactory.ts
├─ shared/
│  ├─ types/
│  └─ utils/                      # 응답 유틸, 에러 유틸
├─ examples/
│  └─ web-demo/                   # Vite + MSW 웹 데모
├─ test/
│  ├─ unit/
│  ├─ integration/
│  └─ mocks/
└─ index.ts
```


## 설계 원칙/패턴

* **DI(의존성 주입)**: 플랫폼 독립성 확보
* **Interface Segregation**: `HttpClient`, `TokenStore`, `AuthProvider`, `ReactNativeBridge`
* **Configuration-Driven**: 환경별 `ApiConfig`
* **SRP/OCP**: 단일 책임 / 확장에 열려 있고 수정에는 닫힘
* **Strategy + Factory + Template Method** 반영


## 문서

* **[사용 가이드](docs/USAGE_GUIDE.md)**: 상세한 사용법과 예시
* **[아키텍처 문서](docs/ARCHITECTURE.md)**: 설계 원칙과 코드 흐름

