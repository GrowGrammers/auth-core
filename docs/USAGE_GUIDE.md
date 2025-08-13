# Auth Core 사용 가이드

## 📋 목차

1. [API 응답 구조](#api-응답-구조)
2. [기본 사용법](#기본-사용법)
3. [API 응답 구조 베스트 프랙티스](#-api-응답-구조-베스트-프랙티스)

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



이 가이드를 따라하면 Auth Core를 각 플랫폼에서 효과적으로 사용할 수 있습니다!

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

## 📚 요약

### 주요 변경사항
1. **모든 API 메서드가 `ApiResponse<T>` 형태 반환**
2. **`success` 필드로 성공/실패 판단**
3. **`data` 필드에서 실제 데이터 접근**
4. **`error` 필드에서 에러 정보 확인**

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


이제 Auth Core의 새로운 API 응답 구조를 활용하여 더 안전하고 일관된 인증 로직을 구현할 수 있습니다! 🚀 