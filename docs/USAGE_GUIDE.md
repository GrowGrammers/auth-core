# Auth Core 사용 가이드

## 📋 목차

1. [API 응답 구조](#api-응답-구조)
2. [기본 사용법](#기본-사용법)
3. [API 응답 구조 베스트 프랙티스](#-api-응답-구조-베스트-프랙티스)
4. [테스트 환경 활용](#-테스트-환경-활용)
5. [유틸리티 함수 활용](#-유틸리티-함수-활용)

## API 응답 구조

모든 API 메서드는 일관된 응답 구조를 사용합니다. 이는 에러 처리와 타입 안전성을 향상시킵니다.

### 응답 타입 정의

```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  data: null;
}

// API 응답 유니온 타입
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### 주요 메서드별 응답 타입

```typescript
// 토큰 검증
validateToken(token: Token): Promise<TokenValidationApiResponse>
// TokenValidationApiResponse = SuccessResponse<boolean> | ErrorResponse

// 사용자 정보 조회
getUserInfo(token: Token): Promise<UserInfoApiResponse>
// UserInfoApiResponse = SuccessResponse<UserInfo> | ErrorResponse

// 서비스 가용성 확인
isAvailable(): Promise<ServiceAvailabilityApiResponse>
// ServiceAvailabilityApiResponse = SuccessResponse<boolean> | ErrorResponse

// 토큰 저장소 메서드들
saveToken(token: Token): Promise<SaveTokenResponse>
getToken(): Promise<GetTokenResponse>
removeToken(): Promise<RemoveTokenResponse>
hasToken(): Promise<HasTokenResponse>
isTokenExpired(): Promise<IsTokenExpiredResponse>
clear(): Promise<ClearResponse>
```

### 주요 변경사항

**이전**
```typescript
// boolean 반환
const isValid = await provider.validateToken(token);
if (isValid) { ... }

// 직접 데이터 접근
const userInfo = await provider.getUserInfo(token);
console.log(userInfo.name);
```

**현재**
```typescript
// ApiResponse 반환
const result = await provider.validateToken(token);
if (result.success && result.data) { ... }

// 안전한 데이터 접근
const result = await provider.getUserInfo(token);
if (result.success) {
  console.log(result.data.name);
}
```


## 기본 사용법

### 1. AuthManager 생성

```typescript
import { 
  createAuthManager,
  AuthManagerConfig,
  FakeTokenStore,
  HttpClient,
  HttpRequestConfig,
  HttpResponse
} from 'auth-core';

// Mock HTTP 클라이언트 구현
class MockHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {},
      json: () => Promise.resolve({ 
        accessToken: 'test-token', 
        user: { id: '1', email: 'test@example.com' } 
      }),
      text: () => Promise.resolve('{"accessToken": "test-token"}')
    };
  }
}

// API 설정
const apiConfig = {
  baseUrl: 'https://api.example.com',
  endpoints: {
    requestVerification: '/auth/email/verification',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    validate: '/auth/validate',
    me: '/auth/me',
    health: '/auth/health'
  },
  timeout: 10000,
  retryCount: 3
};

// AuthManager 설정
const authManagerConfig: AuthManagerConfig = {
  providerType: 'email',
  apiConfig,
  httpClient: new MockHttpClient()  // ← 필수! HTTP 클라이언트 주입
};

// AuthManager 생성
const authManager = new AuthManager(authManagerConfig);
```

### 2. 인증 플로우 사용

```typescript
// 1. 이메일 인증 요청
const verificationResult = await authManager.requestEmailVerification({
  email: 'user@example.com'
});

if (verificationResult.success) {
  console.log('인증번호가 전송되었습니다.');
} else {
  console.error('인증번호 전송 실패:', verificationResult.error);
}

// 2. 로그인
const loginResult = await authManager.login({
  provider: 'email',
  email: 'user@example.com',
  verificationCode: '123456',
  rememberMe: true
});

if (loginResult.success) {
  console.log('로그인 성공!');
  console.log('사용자 정보:', loginResult.data?.userInfo);
} else {
  console.error('로그인 실패:', loginResult.error);
}

// 3. 토큰 검증
const validationResult = await authManager.validateCurrentToken();
if (validationResult.success) {
  console.log('토큰이 유효합니다.');
} else {
  console.log('토큰이 유효하지 않습니다:', validationResult.error);
}

// 4. 사용자 정보 조회
const userInfoResult = await authManager.getCurrentUserInfo();
if (userInfoResult.success) {
  console.log('현재 사용자:', userInfoResult.data);
} else {
  console.log('사용자 정보 조회 실패:', userInfoResult.error);
}

// 5. 토큰 갱신
const tokenResult = await authManager.getToken();
if (tokenResult.success && tokenResult.data?.refreshToken) {
  const refreshResult = await authManager.refreshToken({
    refreshToken: tokenResult.data.refreshToken
  });
  if (refreshResult.success) {
    console.log('토큰 갱신 성공');
  } else {
    console.log('토큰 갱신 실패:', refreshResult.error);
  }
}

// 6. 로그아웃
const token = await authManager.getToken();
if (token.success && token.data) {
  const logoutResult = await authManager.logout({
    token: token.data
  });
  if (logoutResult.success) {
    console.log('로그아웃 성공');
  } else {
    console.log('로그아웃 실패:', logoutResult.error);
  }
}
```

### 3. 토큰 관리

```typescript
// 토큰 조회
const tokenResult = await authManager.getToken();
if (tokenResult.success) {
  console.log('현재 토큰:', tokenResult.data);
} else {
  console.log('토큰 조회 실패:', tokenResult.error);
}

// 인증 상태 확인
const authStatusResult = await authManager.isAuthenticated();
if (authStatusResult.success) {
  console.log('인증 상태:', authStatusResult.data);
} else {
  console.log('인증 상태 확인 실패:', authStatusResult.error);
}

// 모든 인증 데이터 정리
const clearResult = await authManager.clear();
if (clearResult.success) {
  console.log('정리 완료');
} else {
  console.log('정리 실패:', clearResult.error);
}
```


## API 응답 구조 베스트 프랙티스

### 1. 일관된 에러 처리

```typescript
// ✅ 권장: 구조화된 에러 처리
const handleApiCall = async () => {
  const result = await authManager.validateCurrentToken();
  
  if (result.success) {
    // 성공 케이스 처리
    console.log('성공:', result.data);
  } else {
    // 에러 케이스 처리
    console.error('에러:', result.error);
    console.log('메시지:', result.message);
  }
};

// ❌ 비권장: try-catch만 사용
const handleApiCall = async () => {
  try {
    const result = await authManager.validateCurrentToken();
    console.log('결과:', result);
  } catch (error) {
    console.error('에러:', error);
  }
};
```

### 2. 타입 가드 활용

```typescript
// ✅ 권장: 타입 가드로 안전한 접근
const processUserInfo = async () => {
  const result = await authManager.getCurrentUserInfo();
  
  if (result.success && result.data) {
    // result.data는 UserInfo 타입으로 좁혀짐
    console.log('사용자 이름:', result.data.name);
    console.log('사용자 이메일:', result.data.email);
  }
};

// ❌ 비권장: 타입 단언
const processUserInfo = async () => {
  const result = await authManager.getCurrentUserInfo();
  
  if (result.success) {
    // 타입 단언은 런타임 에러 위험
    const userInfo = result.data as UserInfo;
    console.log('사용자 이름:', userInfo.name);
  }
};
```

### 3. 조건부 렌더링 (React)

```typescript
// ✅ 권장: 응답 구조에 따른 조건부 렌더링
const UserProfile: React.FC = () => {
  const [userResult, setUserResult] = useState<UserInfoApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await authManager.getCurrentUserInfo();
      setUserResult(result);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  
  if (!userResult || !userResult.success) {
    return <div>사용자 정보를 불러올 수 없습니다: {userResult?.error}</div>;
  }

  return (
    <div>
      <h1>{userResult.data.name}</h1>
      <p>{userResult.data.email}</p>
    </div>
  );
};
```

## 테스트 환경 활용

### 1. 단위 테스트 실행

```bash
# 모든 단위 테스트 실행
npm run test:run

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### 2. 통합 테스트 실행

```bash
# 로컬 환경 통합 테스트
npm run integration:local

# MSW를 사용한 모킹 통합 테스트
npm run integration:msw

# 배포된 백엔드로 통합 테스트
npm run integration:deployed
```

### 3. 웹 데모 테스트

```bash
# 웹 데모 실행
cd examples/web-demo
npm install
npm run dev
```

웹 데모에서는 다음을 테스트할 수 있습니다:
- MSW를 사용한 API 모킹
- 실제 HTTP 클라이언트
- Mock HTTP 클라이언트
- 전체 인증 플로우 시나리오

## 유틸리티 함수 활용

### 1. 기본 응답 생성

```typescript
import { createSuccessResponse, createErrorResponse } from 'auth-core';

// 성공 응답 생성
const successResponse = createSuccessResponse(
  '사용자 정보 조회 성공',
  { id: '123', name: '홍길동' }
);

// 에러 응답 생성
const errorResponse = createErrorResponse(
  '사용자 정보 조회 실패',
  '사용자를 찾을 수 없습니다.'
);
```

### 2. 전용 에러 응답 함수들

```typescript
import { 
  createTokenValidationErrorResponse,
  createUserInfoErrorResponse,
  createNetworkErrorResponse,
  createValidationErrorResponse,
  createTimeoutErrorResponse
} from 'auth-core';

// 토큰 검증 실패
const tokenError = createTokenValidationErrorResponse('토큰이 만료되었습니다.');

// 사용자 정보 조회 실패
const userError = createUserInfoErrorResponse('권한이 없습니다.');

// 네트워크 오류
const networkError = createNetworkErrorResponse();

// 유효성 검사 실패
const validationError = createValidationErrorResponse('email');

// 타임아웃 오류
const timeoutError = createTimeoutErrorResponse();
```

### 3. 예외 객체로부터 에러 응답 생성

```typescript
import { createErrorResponseFromException } from 'auth-core';

try {
  // API 호출
  const result = await someApiCall();
} catch (error) {
  // 예외를 에러 응답으로 변환
  const errorResponse = createErrorResponseFromException(
    error, 
    'API 호출 중 오류가 발생했습니다.'
  );
  
  // 에러 응답 처리
  console.error('에러:', errorResponse.error);
  console.log('메시지:', errorResponse.message);
}
```

### 4. 커스텀 응답 생성

```typescript
// 특정 도메인에 맞는 응답 생성 함수
function createAuthErrorResponse(errorType: string, details?: string) {
  const errorMessages = {
    'INVALID_CREDENTIALS': '잘못된 인증 정보입니다.',
    'TOKEN_EXPIRED': '인증 토큰이 만료되었습니다.',
    'INSUFFICIENT_PERMISSIONS': '권한이 부족합니다.'
  };
  
  return createErrorResponse(
    errorType,
    details || errorMessages[errorType] || '인증 오류가 발생했습니다.'
  );
}

// 사용 예시
const authError = createAuthErrorResponse('INVALID_CREDENTIALS');
```

## 📚 요약

### 주요 변경사항
1. **모든 API 메서드가 `ApiResponse<T>` 형태 반환**
2. **`success` 필드로 성공/실패 판단**
3. **`data` 필드에서 실제 데이터 접근**
4. **`error` 필드에서 에러 정보 확인**
5. **완벽한 테스트 환경 구축**
6. **유틸리티 함수 제공**

### 사용 패턴
```typescript
const result = await authManager.someMethod();
if (result.success) {
  // 성공: result.data 사용
  processData(result.data);
} else {
  // 실패: result.error 사용
  handleError(result.error);
}
```

 