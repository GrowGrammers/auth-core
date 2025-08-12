import { ErrorResponse } from '../types/common';

/**
 * 에러 응답 객체를 생성하는 헬퍼 함수
 * @param error 에러 메시지
 * @param message 사용자에게 보여줄 메시지 (기본값: error와 동일)
 * @returns ErrorResponse 객체
 */
export function createErrorResponse(
  error: string, 
  message?: string
): ErrorResponse {
  return {
    success: false,
    error,
    message: message || error,
    data: null
  };
}

/**
 * 예외 객체로부터 에러 응답을 생성하는 헬퍼 함수
 * @param error 예외 객체
 * @param defaultMessage 기본 에러 메시지
 * @returns ErrorResponse 객체
 */
export function createErrorResponseFromException(
  error: unknown, 
  defaultMessage: string
): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return createErrorResponse(errorMessage, defaultMessage);
}

/**
 * 네트워크 오류 응답을 생성하는 헬퍼 함수
 * @returns 네트워크 오류 ErrorResponse 객체
 */
export function createNetworkErrorResponse(): ErrorResponse {
  return createErrorResponse('네트워크 오류가 발생했습니다.');
}

/**
 * 유효성 검사 오류 응답을 생성하는 헬퍼 함수
 * @param field 누락된 필드명
 * @returns 유효성 검사 오류 ErrorResponse 객체
 */
export function createValidationErrorResponse(field: string): ErrorResponse {
  return createErrorResponse(`${field}가 필요합니다.`);
}
