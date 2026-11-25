import { groupFieldErrors } from '@handle-it/contracts';
import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { InvalidRequestException } from './invalid-request.exception.js';

/** Valide une entrée avec le schéma partagé et renvoie les erreurs par champ. */
export class ZodValidationPipe<Output> implements PipeTransform<unknown, Output> {
  constructor(private readonly schema: z.ZodType<Output>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new InvalidRequestException(groupFieldErrors(result.error));
    }
    return result.data;
  }
}
