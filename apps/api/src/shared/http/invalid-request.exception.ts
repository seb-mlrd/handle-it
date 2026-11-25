import { BadRequestException } from '@nestjs/common';
import type { FieldErrors } from '@handle-it/contracts';

export class InvalidRequestException extends BadRequestException {
  constructor(private readonly fieldErrors: FieldErrors) {
    super();
  }

  getFieldErrors(): FieldErrors {
    return this.fieldErrors;
  }
}
