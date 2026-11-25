import type { ErrorCode, ErrorResponse } from '@handle-it/contracts';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainError, type DomainErrorKind } from '../domain/domain-error.js';
import { InvalidRequestException } from './invalid-request-exception.js';

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
  invalid: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
};

const CODE_BY_STATUS = new Map<number, ErrorCode>([
  [HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED'],
  [HttpStatus.FORBIDDEN, 'FORBIDDEN'],
  [HttpStatus.NOT_FOUND, 'NOT_FOUND'],
  [HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS'],
]);

export interface MappedError {
  readonly status: number;
  readonly body: ErrorResponse;
}

/** Traduit toute erreur vers le format public, sans détail interne. */
export class ErrorResponseMapper {
  map(error: unknown): MappedError {
    if (error instanceof DomainError) {
      return { status: STATUS_BY_KIND[error.kind], body: { code: error.code } };
    }
    const status = this.findStatus(error);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return { status, body: { code: 'INTERNAL_ERROR' } };
    }
    const code = CODE_BY_STATUS.get(status) ?? 'INVALID_REQUEST';
    const isInvalidRequest = error instanceof InvalidRequestException;
    return {
      status,
      body: isInvalidRequest ? { code, fieldErrors: error.getFieldErrors() } : { code },
    };
  }

  private findStatus(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    // Les erreurs de lecture du corps (trop gros, mal encodé) viennent d'Express, pas de NestJS.
    if (error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
