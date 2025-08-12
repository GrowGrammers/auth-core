// 기본 인증 제공자 유틸리티 클래스 - 공통 응답 생성 메서드 제공
import { BaseResponse, ErrorResponse } from '../../shared/types';

export abstract class BaseAuthProvider {
  /**
   * 성공 응답 생성 메서드
   */
  protected createSuccessResponse<T extends BaseResponse>(
    message: string,
    data?: unknown,
    additionalData?: Partial<T>
  ): T {
    return {
      success: true,
      message,
      data,
      ...additionalData
    } as T;
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