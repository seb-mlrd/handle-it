import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_ALREADY_USED',
  'TOO_MANY_REQUESTS',
  'INTERNAL_ERROR',
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Format unique de toutes les erreurs de l'API. */
export const errorResponseSchema = z.object({
  code: errorCodeSchema,
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
