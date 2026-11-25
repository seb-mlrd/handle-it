import type { ErrorCode, FieldErrors } from '@handle-it/contracts';

/** `UNREACHABLE` : aucune réponse exploitable (réseau coupé, délai dépassé, proxy en erreur). */
export type ApiErrorCode = ErrorCode | 'UNREACHABLE';

export class ApiError extends Error {
  constructor(
    private readonly code: ApiErrorCode,
    private readonly fieldErrors: FieldErrors = {},
  ) {
    super(`Erreur de l'API : ${code}`);
  }

  getCode(): ApiErrorCode {
    return this.code;
  }

  getFieldErrors(): FieldErrors {
    return this.fieldErrors;
  }
}
