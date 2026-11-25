import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { type FieldErrors, InvalidRequestException } from './invalid-request.exception.js';

/** Valide une entrée avec le schéma partagé et renvoie les erreurs par champ. */
export class ZodValidationPipe<Output> implements PipeTransform<unknown, Output> {
  constructor(private readonly schema: z.ZodType<Output>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new InvalidRequestException(this.groupByField(result.error));
    }
    return result.data;
  }

  private groupByField(error: z.ZodError): FieldErrors {
    const fieldErrors: FieldErrors = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.');
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
    return fieldErrors;
  }
}
