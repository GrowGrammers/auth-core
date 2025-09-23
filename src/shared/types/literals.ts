// 인증 제공자 리터럴 타입 정의
// shared/types/literals.ts

// 인증 제공자 타입 (순환 참조 방지를 위해 별도 파일로 분리)
export type AuthProviderType = 'email' | 'google' | 'kakao' | 'fake';

// 클라이언트 플랫폼 타입
export type ClientPlatformType = 'web' | 'app' | 'react-native';
