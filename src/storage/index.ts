// 토큰 저장소 모듈 export
export * from './TokenStore.interface';
// 플랫폼 의존적인 구현체들은 각 플랫폼 모듈로 이동
// export { WebTokenStore } from './WebTokenStore';
// export { MobileTokenStore } from './MobileTokenStore';
export { FakeTokenStore } from './FakeTokenStore';

// Storage 레이어 전용 응답 생성 유틸리티 (공통 유틸리티 재사용)
export { createSuccessResponse as createStorageSuccessResponse } from '../shared/utils';
export { createErrorResponse as createStorageErrorResponse } from '../shared/utils'; 