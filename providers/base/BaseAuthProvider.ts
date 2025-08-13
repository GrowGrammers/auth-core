// 기본 인증 제공자 유틸리티 클래스 - 공통 응답 생성 메서드 제공
import { SuccessResponse, ErrorResponse } from '../../shared/types';
import { createSuccessResponse as createBaseSuccessResponse, createErrorResponse as createBaseErrorResponse } from '../../shared/utils';

export abstract class BaseAuthProvider {
  /**
   * 성공 응답 생성 메서드
   */
  protected createSuccessResponse<T>(
    message: string,
    data: T,
    additionalData?: Partial<Omit<SuccessResponse<T>, 'success' | 'data'>>
  ): SuccessResponse<T> {
    const baseResponse = createBaseSuccessResponse(message, data);
    return {
      ...baseResponse,
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
    return createBaseErrorResponse(error, message);
  }
} 