// API 모듈 메인 인덱스 파일
// 모든 API 함수들을 다시 export하여 기존 import 구조를 유지합니다.

// 공통 유틸리티 함수들
export {
  makeRequest,
  makeRequestWithRetry,
  handleHttpResponse,
  createToken,
  createUserInfo
} from './utils/httpUtils';

// 이메일 인증 API 함수들
export {
  requestEmailVerification,
  loginByEmail,
  logoutByEmail,
  refreshTokenByEmail,
  validateTokenByEmail,
  getUserInfoByEmail,
  checkEmailServiceAvailability
} from './emailAuthApi';

// Google OAuth API 함수들
export {
  loginByGoogle,
  logoutByGoogle,
  refreshTokenByGoogle,
  validateTokenByGoogle,
  getUserInfoByGoogle,
  checkGoogleServiceAvailability
} from './googleAuthApi';

// 타입들은 루트 types.ts에서 관리하므로 여기서는 export하지 않음 