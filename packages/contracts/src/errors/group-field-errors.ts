import type { z } from 'zod';
import type { FieldErrors } from './dto/error-response.dto.js';

/** Regroupe les erreurs de validation par champ, de la même façon côté front et côté API. */
export function groupFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.');
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return fieldErrors;
}
