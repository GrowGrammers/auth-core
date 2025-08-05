// 기본 인증 제공자 유틸리티 클래스 - 공통 응답 생성 메서드 제공
import { BaseResponse } from '../../types';

export abstract class BaseAuthProvider {
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
} 