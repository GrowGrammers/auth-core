// 기본 인증 제공자 추상 클래스 : API 호출 로직이 외부 모듈로 분리된 버전
import { Token, UserInfo, BaseResponse } from '../../types';
import { 
  AuthProvider, 
  AuthProviderConfig, 
  EmailVerificationRequest,
  EmailVerificationResponse,
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '../interfaces/AuthProvider';

export abstract class BaseAuthProvider implements AuthProvider {
  abstract readonly providerName: AuthProvider['providerName'];
  abstract readonly config: AuthProviderConfig;

  /**
   * 공통 응답 생성 메서드 - 제네릭을 사용하여 타입 안전성 확보
   */
  protected createResponse<T extends BaseResponse>(
    success: boolean, 
    error?: string, 
    errorCode?: string,
    additionalData?: Partial<T>
  ): T {
    return {
      success,
      error,
      errorCode,
      ...additionalData
    } as T;
  }

  // 추상 메서드들 - 하위 클래스에서 구현
  abstract requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationResponse>;
  abstract login(request: LoginRequest): Promise<LoginResponse>;
  abstract logout(request: LogoutRequest): Promise<LogoutResponse>;
  abstract refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
  abstract validateToken(token: Token): Promise<boolean>;
  abstract getUserInfo(token: Token): Promise<UserInfo | null>;
  abstract isAvailable(): Promise<boolean>;
} 