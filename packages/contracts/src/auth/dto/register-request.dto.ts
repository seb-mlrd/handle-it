import { z } from 'zod';
import { emailSchema } from '../email-schema.js';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../password-limits.js';

const DISPLAY_NAME_MAX_LENGTH = 50;

export const registerRequestSchema = z.object({
  email: emailSchema,
  displayName: z
    .string('Le nom est obligatoire')
    .trim()
    .min(1, 'Le nom est obligatoire')
    .max(DISPLAY_NAME_MAX_LENGTH, `Le nom est limité à ${DISPLAY_NAME_MAX_LENGTH} caractères`),
  password: z
    .string('Le mot de passe est obligatoire')
    .min(
      PASSWORD_MIN_LENGTH,
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
    )
    .max(PASSWORD_MAX_LENGTH, `Le mot de passe est limité à ${PASSWORD_MAX_LENGTH} caractères`),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
