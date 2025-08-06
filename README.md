# Auth Core

**플랫폼 독립적인 인증 라이브러리**입니다. 웹, 모바일, 백엔드 등 모든 환경에서 동일한 인증 로직을 사용할 수 있도록 설계되었습니다.

 **팀 프로젝트 컨텍스트**: 이 모듈은 4개 모듈 중 하나인 **공통 클라이언트 모듈**입니다.
> - 📁 **auth-core** ← 로그인 흐름의 클라이언트 공통 모듈 (TS 기반) ← **현재 모듈**
> - 📁 AuthWebModule ← 웹 특화 모듈 (리디렉션, 쿼리 파싱 등)
> - 📁 mobile-app ← 모바일 특화 모듈 (딥링크, SecureStorage 등)
> - 📁 AuthBackendService ← 백엔드 전용 로그인 모듈 (Java Spring 기반)

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
    ↓ (HTTP 클라이언트 주입)
Auth Core (공통 모듈)
    ↓ (API 요청)
AuthBackendService (백엔드)

mobile-app (모바일 특화)
    ↓ (토큰 저장소 주입)
Auth Core (공통 모듈)
    ↓ (API 요청)
AuthBackendService (백엔드)
```

## 🚀 주요 특징

- **🔧 플랫폼 독립성**: HTTP 클라이언트와 토큰 저장소를 주입받아 사용
- **⚙️ 설정 가능한 API**: 환경별 API 엔드포인트 설정 지원
- **🛡️ 타입 안전성**: TypeScript로 완전한 타입 지원
- **📦 모듈화**: 필요한 기능만 선택적으로 사용 가능
- **🤝 공통 모듈**: 웹/모바일/백엔드 모듈에서 공통으로 사용하는 인증 로직

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
├── factories/                    # 객체 생성 (Factory Pattern)
├── types.ts                      # 공통 타입 정의
└── index.ts                      # 진입점 export
```

## 🎯 빠른 시작

### 기본 사용법

```typescript
import { AuthManager } from 'auth-core';

// 1. AuthManager 인스턴스 생성
const authManager = new AuthManager({
  providerType: 'email',
  apiConfig: {
    baseUrl: 'https://api.myservice.com',
    endpoints: {
      login: '/api/v1/login',
      logout: '/api/v1/logout',
      requestVerification: '/email/verify'
    }
  },
  httpClient: myHttpClient  // 서비스에서 주입
});

// 2. 이메일 인증 요청
await authManager.requestEmailVerification({ 
  email: 'user@example.com' 
});

// 3. 로그인
const result = await authManager.login({
  email: 'user@example.com',
  verificationCode: '123456'
});
```

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

### HTTP 클라이언트
```typescript
interface HttpClient {
  request(config: HttpRequestConfig): Promise<HttpResponse>;
}
```

### 토큰 저장소
```typescript
interface TokenStore {
  saveToken(token: Token): Promise<boolean>;
  getToken(): Promise<Token | null>;
  removeToken(): Promise<boolean>;
}
```

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
