// 인증 제공자 인터페이스 정의
import { ILoginProvider } from './ILoginProvider';
import { IEmailVerifiable } from './IEmailVerifiable';

// 인증 제공자 인터페이스 - 하위 호환성을 위한 유니온 타입
// 새로운 구현체는 ILoginProvider 또는 IEmailVerifiable을 직접 구현하는 것을 권장
export type AuthProvider = ILoginProvider | (ILoginProvider & IEmailVerifiable); 