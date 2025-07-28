# Auth Core

로그인 모듈의 공통 라이브러리입니다.

## 구조

```
auth-core/
├── providers/                     # 로그인 방식 전략 모음 (Strategy)
│   ├── AuthProvider.ts            # 공통 인터페이스
│   ├── EmailAuthProvider.ts       # 이메일 로그인 구현
│   ├── GoogleAuthProvider.ts      # 구글 로그인 구현
│   └── KakaoAuthProvider.ts       # 카카오 로그인 구현 (예정)
│
├── factories/                     # 전략 객체 생성 책임 (Factory)
│   └── AuthProviderFactory.ts     # 문자열 or config 기반으로 전략 생성
│
├── storage/                       # 토큰 저장 전략
│   ├── TokenStore.interface.ts    # 저장 전략 인터페이스
│   ├── WebTokenStore.ts           # 웹 환경 저장소 (ex: localStorage)
│   ├── MobileTokenStore.ts        # 모바일 환경 저장소 (ex: SecureStore)
│   └── FakeTokenStore.ts          # 테스트용 가짜 저장소
│
├── AuthManager.ts                 # 전략들을 주입받아 로그인 흐름 제어
├── types.ts                       # 공통 타입 모음
└── index.ts                       # 진입점 export 정리
```

## 설계 패턴

- **Strategy Pattern**: 다양한 로그인 방식을 전략으로 구현
- **Factory Pattern**: 설정에 따라 적절한 인증 제공자 생성
- **Dependency Injection**: 토큰 저장소와 인증 제공자를 주입받아 사용

## 사용 예정 환경

- 웹 프론트엔드
- 웹 백엔드  
- 모바일 앱 