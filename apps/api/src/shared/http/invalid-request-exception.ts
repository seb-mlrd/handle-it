import { BadRequestException } from '@nestjs/common';
import type { ErrorResponse } from '@handle-it/contracts';

export type FieldErrors = NonNullable<ErrorResponse['fieldErrors']>;

export class InvalidRequestException extends BadRequestException {
  constructor(private readonly fieldErrors: FieldErrors) {
    super();
  }

  getFieldErrors(): FieldErrors {
    return this.fieldErrors;
  }
}
