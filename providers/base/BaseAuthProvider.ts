// 기본 인증 제공자 유틸리티 클래스 - 공통 응답 생성 메서드 제공
import { SuccessResponse, ErrorResponse } from '../../shared/types';

export abstract class BaseAuthProvider {
  /**
   * 성공 응답 생성 메서드
   */
  protected createSuccessResponse<T>(
    message: string,
    data: T,
    additionalData?: Partial<Omit<SuccessResponse<T>, 'success' | 'data'>>
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      ...additionalData
    };
  }

  /**
   * 실패 응답 생성 메서드
   */
  protected createErrorResponse(
    message: string,
    error: string
  ): ErrorResponse {
    return {
      success: false,
      message,
      error,
      data: null
    };
  }
} 