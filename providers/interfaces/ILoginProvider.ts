// 공통 로그인 기능 인터페이스
import { Token, UserInfo } from '../../types';
import { AuthProviderConfig } from './config/auth-config';
import { 
  LoginRequest, 
  LoginResponse, 
  LogoutRequest, 
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from './dtos/auth.dto';

export interface ILoginProvider {
  /**
   * 제공자 이름
   */
  readonly providerName: string;
  
  /**
   * 제공자 설정
   */
  readonly config: AuthProviderConfig;
  
  /**
   * 로그인을 수행합니다.
   * @param request 로그인 요청 정보
   * @returns 로그인 결과
   */
  login(request: LoginRequest): Promise<LoginResponse>;
  
  /**
   * 로그아웃을 수행합니다.
   * @param request 로그아웃 요청 정보
   * @returns 로그아웃 결과
   */
  logout(request: LogoutRequest): Promise<LogoutResponse>;
  
  /**
   * 토큰을 갱신합니다.
   * @param request 토큰 갱신 요청 정보
   * @returns 토큰 갱신 결과
   */
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
  
  /**
   * 현재 토큰의 유효성을 검증합니다.
   * @param token 검증할 토큰
   * @returns 유효성 검증 결과
   */
  validateToken(token: Token): Promise<boolean>;
  
  /**
   * 사용자 정보를 가져옵니다.
   * @param token 인증 토큰
   * @returns 사용자 정보
   */
  getUserInfo(token: Token): Promise<UserInfo | null>;
  
  /**
   * 제공자가 사용 가능한지 확인합니다.
   * @returns 사용 가능 여부
   */
  isAvailable(): Promise<boolean>;
} 