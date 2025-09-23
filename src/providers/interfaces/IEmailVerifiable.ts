// 이메일 인증 기능 인터페이스
import { 
  EmailVerificationRequest,
  EmailVerificationResponse,
  EmailVerificationApiResponse,
  EmailVerificationConfirmRequest,
  EmailVerificationConfirmApiResponse
} from './dtos/auth.dto';

export interface IEmailVerifiable {
  /**
   * 이메일 인증번호를 요청합니다.
   * @param request 이메일 인증번호 요청 정보
   * @returns 인증번호 요청 결과
   */
  requestEmailVerification(request: EmailVerificationRequest): Promise<EmailVerificationApiResponse>;

  /**
   * 이메일 인증번호를 확인합니다.
   * @param request 이메일 인증번호 확인 정보
   * @returns 인증번호 확인 결과
   */
  verifyEmail(request: EmailVerificationConfirmRequest): Promise<EmailVerificationConfirmApiResponse>;
} 