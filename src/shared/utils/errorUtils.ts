import { ErrorResponse, SuccessResponse } from '../types/common';

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

/**
 * 토큰 검증 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '토큰이 유효하지 않습니다.')
 * @returns 토큰 검증 실패 ErrorResponse 객체
 */
export function createTokenValidationErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('토큰 검증 실패', reason || '토큰이 유효하지 않습니다.');
}

/**
 * 사용자 정보 조회 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '사용자 정보를 가져올 수 없습니다.')
 * @returns 사용자 정보 조회 실패 ErrorResponse 객체
 */
export function createUserInfoErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('사용자 정보 조회 실패', reason || '사용자 정보를 가져올 수 없습니다.');
}

/**
 * 서비스 가용성 확인 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '서비스를 사용할 수 없습니다.')
 * @returns 서비스 가용성 확인 실패 ErrorResponse 객체
 */
export function createServiceAvailabilityErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('서비스 가용성 확인 실패', reason || '서비스를 사용할 수 없습니다.');
}

/**
 * 타임아웃 오류 응답을 생성하는 헬퍼 함수
 * @returns 타임아웃 오류 ErrorResponse 객체
 */
export function createTimeoutErrorResponse(): ErrorResponse {
  return createErrorResponse('요청 시간이 초과되었습니다.');
}

/**
 * 서버 오류 응답을 생성하는 헬퍼 함수
 * @param statusCode HTTP 상태 코드
 * @returns 서버 오류 ErrorResponse 객체
 */
export function createServerErrorResponse(statusCode: number): ErrorResponse {
  const message = `서버 오류가 발생했습니다. (${statusCode})`;
  return createErrorResponse('서버 오류', message);
}

/**
 * 토큰 저장 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '토큰 저장에 실패했습니다.')
 * @returns 토큰 저장 실패 ErrorResponse 객체
 */
export function createTokenSaveErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('토큰 저장 실패', reason || '토큰 저장에 실패했습니다.');
}

/**
 * 토큰 읽기 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '토큰 읽기에 실패했습니다.')
 * @returns 토큰 읽기 실패 ErrorResponse 객체
 */
export function createTokenReadErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('토큰 읽기 실패', reason || '토큰 읽기에 실패했습니다.');
}

/**
 * 토큰 삭제 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '토큰 삭제에 실패했습니다.')
 * @returns 토큰 삭제 실패 ErrorResponse 객체
 */
export function createTokenDeleteErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('토큰 삭제 실패', reason || '토큰 삭제에 실패했습니다.');
}

/**
 * 저장소 초기화 실패 응답을 생성하는 헬퍼 함수
 * @param reason 실패 이유 (기본값: '저장소 초기화에 실패했습니다.')
 * @returns 저장소 초기화 실패 ErrorResponse 객체
 */
export function createStorageClearErrorResponse(reason?: string): ErrorResponse {
  return createErrorResponse('저장소 초기화 실패', reason || '저장소 초기화에 실패했습니다.');
}


