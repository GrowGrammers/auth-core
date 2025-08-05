# Auth Core 사용 가이드

## 📋 목차

1. [개요](#개요)
2. [기본 사용법](#기본-사용법)
3. [플랫폼별 구현](#플랫폼별-구현)
4. [고급 사용법](#고급-사용법)

## 개요

Auth Core는 **플랫폼 독립적인 인증 라이브러리**입니다. 웹, 모바일, 백엔드 등 모든 환경에서 동일한 인증 로직을 사용할 수 있도록 설계되었습니다.


## 기본 사용법

### 1. AuthManager 생성

```typescript
import { 
  createAuthManager, 
  getDefaultApiConfig,
  FakeTokenStore 
} from 'auth-core';

// Mock HTTP 클라이언트 (실제로는 플랫폼별 구현체 사용)
class MockHttpClient {
  async request(config) {
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

// AuthManager 생성
const authManager = createAuthManager({
  providerType: 'email',
  tokenStoreType: 'fake',
  apiConfig: getDefaultApiConfig('https://api.example.com'),
  httpClient: new MockHttpClient(),
  tokenStoreRegistry: {
    web: FakeTokenStore,
    mobile: FakeTokenStore,
    fake: FakeTokenStore
  }
});
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
  console.log('사용자 정보:', loginResult.user);
} else {
  console.error('로그인 실패:', loginResult.error);
}

// 3. 토큰 검증
const isValid = await authManager.validateCurrentToken();
console.log('토큰 유효성:', isValid);

// 4. 사용자 정보 조회
const userInfo = await authManager.getCurrentUserInfo();
console.log('현재 사용자:', userInfo);

// 5. 토큰 갱신
const token = await authManager.getToken();
if (token?.refreshToken) {
  const refreshResult = await authManager.refreshToken({
    refreshToken: token.refreshToken
  });
  console.log('토큰 갱신 결과:', refreshResult);
}

// 6. 로그아웃
const logoutResult = await authManager.logout({
  token: await authManager.getToken()
});
console.log('로그아웃 결과:', logoutResult);
```

### 3. 토큰 관리

```typescript
// 토큰 저장
await authManager.saveToken({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() + 3600000 // 1시간 후 만료
});

// 토큰 조회
const token = await authManager.getToken();
console.log('현재 토큰:', token);

// 토큰 삭제
await authManager.removeToken();

// 토큰 만료 확인
const isExpired = await authManager.isTokenExpired();
console.log('토큰 만료 여부:', isExpired);

// 인증 상태 확인
const isAuthenticated = await authManager.isAuthenticated();
console.log('인증 상태:', isAuthenticated);
```

## 플랫폼별 구현

### 웹 프론트엔드

#### HTTP 클라이언트 구현

```typescript
// src/http/FetchHttpClient.ts
import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';

export class FetchHttpClient implements HttpClient {
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
```

#### 토큰 저장소 구현

```typescript
// src/storage/WebTokenStore.ts
import { TokenStore, Token } from 'auth-core';

export const WebTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      localStorage.setItem('accessToken', token.accessToken);
      if (token.refreshToken) {
        localStorage.setItem('refreshToken', token.refreshToken);
      }
      if (token.expiresAt) {
        localStorage.setItem('expiresAt', token.expiresAt.toString());
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
    const expiresAtStr = localStorage.getItem('expiresAt');
    const expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;
    
    return { accessToken, refreshToken, expiresAt };
  },

  async removeToken(): Promise<boolean> {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      return true;
    } catch (error) {
      return false;
    }
  },

  async hasToken(): Promise<boolean> {
    return localStorage.getItem('accessToken') !== null;
  },

  async isTokenExpired(): Promise<boolean> {
    const expiresAtStr = localStorage.getItem('expiresAt');
    if (!expiresAtStr) return false;
    const expiresAt = Number(expiresAtStr);
    return Date.now() > expiresAt;
  },

  async clear(): Promise<boolean> {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      return true;
    } catch (error) {
      return false;
    }
  }
};
```

#### AuthManager 설정

```typescript
// src/auth/authManager.ts
import { 
  createAuthManager, 
  getDefaultApiConfig, 
  TokenStoreRegistry 
} from 'auth-core';
import { FetchHttpClient } from '../http/FetchHttpClient';
import { WebTokenStore } from '../storage/WebTokenStore';

// 토큰 저장소 레지스트리 생성
const tokenStoreRegistry: TokenStoreRegistry = {
  web: WebTokenStore,
  mobile: WebTokenStore, // 웹에서는 모바일용도 웹용으로 사용
  fake: WebTokenStore    // 테스트용도 웹용으로 사용
};

// API 설정
const apiConfig = getDefaultApiConfig('https://api.example.com');

// AuthManager 생성
export const authManager = createAuthManager({
  providerType: 'email',
  tokenStoreType: 'web',
  apiConfig,
  httpClient: new FetchHttpClient(),
  tokenStoreRegistry
});
```

#### React 컴포넌트에서 사용

```typescript
// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { authManager } from '../auth/authManager';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestVerification = async () => {
    try {
      const response = await authManager.requestEmailVerification({
        email
      });

      if (response.success) {
        setMessage('인증번호가 전송되었습니다.');
      } else {
        setMessage(`인증번호 전송 실패: ${response.error}`);
      }
    } catch (error) {
      setMessage('인증번호 요청 중 오류가 발생했습니다.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authManager.login({
        provider: 'email',
        email,
        verificationCode,
        rememberMe: true
      });

      if (response.success) {
        setMessage('로그인 성공!');
        // 로그인 성공 후 처리 (예: 리다이렉트)
      } else {
        setMessage(`로그인 실패: ${response.error}`);
      }
    } catch (error) {
      setMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <button type="button" onClick={handleRequestVerification}>
        인증번호 요청
      </button>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="인증번호"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
};
```

### 모바일 앱 (React Native)

#### HTTP 클라이언트 구현

```typescript
// src/http/AxiosHttpClient.ts
import { HttpClient, HttpRequestConfig, HttpResponse } from 'auth-core';
import axios from 'axios';

export class AxiosHttpClient implements HttpClient {
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
      if (axios.isAxiosError(error)) {
        return {
          ok: false,
          status: error.response?.status || 0,
          statusText: error.message,
          headers: error.response?.headers || {},
          json: () => Promise.resolve(error.response?.data),
          text: () => Promise.resolve(JSON.stringify(error.response?.data))
        };
      }
      throw error;
    }
  }
}
```

#### 토큰 저장소 구현

```typescript
// src/storage/MobileTokenStore.ts
import { TokenStore, Token } from 'auth-core';
import * as SecureStore from 'expo-secure-store';

export const MobileTokenStore: TokenStore = {
  async saveToken(token: Token): Promise<boolean> {
    try {
      await SecureStore.setItemAsync('accessToken', token.accessToken);
      if (token.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', token.refreshToken);
      }
      if (token.expiresAt) {
        await SecureStore.setItemAsync('expiresAt', token.expiresAt.toString());
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
      const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
      const expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;
      
      return { accessToken, refreshToken, expiresAt };
    } catch (error) {
      return null;
    }
  },

  async removeToken(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('expiresAt');
      return true;
    } catch (error) {
      return false;
    }
  },

  async hasToken(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      return accessToken !== null;
    } catch (error) {
      return false;
    }
  },

  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAtStr = await SecureStore.getItemAsync('expiresAt');
      if (!expiresAtStr) return false;
      const expiresAt = Number(expiresAtStr);
      return Date.now() > expiresAt;
    } catch (error) {
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('expiresAt');
      return true;
    } catch (error) {
      return false;
    }
  }
};
```

#### AuthManager 설정

```typescript
// src/auth/authManager.ts
import { 
  createAuthManager, 
  getDefaultApiConfig, 
  TokenStoreRegistry 
} from 'auth-core';
import { AxiosHttpClient } from '../http/AxiosHttpClient';
import { MobileTokenStore } from '../storage/MobileTokenStore';

const tokenStoreRegistry: TokenStoreRegistry = {
  web: MobileTokenStore,   // 모바일에서는 웹용도 모바일용으로 사용
  mobile: MobileTokenStore,
  fake: MobileTokenStore
};

const apiConfig = getDefaultApiConfig('https://api.example.com');

export const authManager = createAuthManager({
  providerType: 'email',
  tokenStoreType: 'mobile',
  apiConfig,
  httpClient: new AxiosHttpClient(),
  tokenStoreRegistry
});
```

## 고급 사용법

### 1. 커스텀 API 설정

```typescript
import { getDefaultApiConfig, mergeApiConfig } from 'auth-core';

// 기본 설정
const baseConfig = getDefaultApiConfig('https://api.example.com');

// 커스텀 엔드포인트 설정
const customConfig = mergeApiConfig(baseConfig, {
  endpoints: {
    login: '/custom/auth/login',
    logout: '/custom/auth/logout',
    refresh: '/custom/auth/refresh'
  },
  timeout: 15000,  // 15초 타임아웃
  retryCount: 5    // 5번 재시도
});

// AuthManager에 커스텀 설정 적용
const authManager = createAuthManager({
  providerType: 'email',
  tokenStoreType: 'web',
  apiConfig: customConfig,
  httpClient: new FetchHttpClient(),
  tokenStoreRegistry
});
```

### 2. 토큰 자동 갱신

```typescript
// src/auth/tokenRefresh.ts
import { authManager } from './authManager';

export const setupTokenRefresh = () => {
  // 토큰 만료 5분 전에 자동 갱신
  const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5분

  const checkAndRefreshToken = async () => {
    const token = await authManager.getToken();
    if (!token || !token.expiresAt) return;

    const timeUntilExpiry = token.expiresAt - Date.now();
    
    if (timeUntilExpiry <= REFRESH_BEFORE_EXPIRY) {
      try {
        await authManager.refreshToken({
          refreshToken: token.refreshToken!
        });
        console.log('토큰 자동 갱신 완료');
      } catch (error) {
        console.error('토큰 갱신 실패:', error);
        // 로그아웃 처리
        await authManager.logout({ token });
      }
    }
  };

  // 1분마다 체크
  setInterval(checkAndRefreshToken, 60 * 1000);
  
  // 초기 체크
  checkAndRefreshToken();
};
```

### 3. 인증 상태 관리 (React Context)

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authManager } from '../auth/authManager';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (credentials: any) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userInfo = await authManager.getCurrentUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any): Promise<boolean> => {
    try {
      const response = await authManager.login(credentials);
      if (response.success) {
        setIsAuthenticated(true);
        const userInfo = await authManager.getCurrentUserInfo();
        setUser(userInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authManager.logout({ token: await authManager.getToken() });
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```


### 4. 보안 고려사항

```typescript
// 토큰 암호화 저장 (웹 환경)
class EncryptedWebTokenStore implements TokenStore {
  private encrypt(data: string): string {
    // 실제로는 더 강력한 암호화 사용
    return btoa(data);
  }

  private decrypt(data: string): string {
    return atob(data);
  }

  async saveToken(token: Token): Promise<boolean> {
    try {
      localStorage.setItem('accessToken', this.encrypt(token.accessToken));
      if (token.refreshToken) {
        localStorage.setItem('refreshToken', this.encrypt(token.refreshToken));
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async getToken(): Promise<Token | null> {
    try {
      const encryptedToken = localStorage.getItem('accessToken');
      if (!encryptedToken) return null;
      
      const accessToken = this.decrypt(encryptedToken);
      return { accessToken };
    } catch (error) {
      return null;
    }
  }

  // 다른 메서드들도 구현...
}
```

이 가이드를 따라하면 Auth Core를 각 플랫폼에서 효과적으로 사용할 수 있습니다! 