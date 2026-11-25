import { z } from 'zod';
import { emailSchema } from './email-schema.js';
import { PASSWORD_MAX_LENGTH } from './password-limits.js';

// Les règles de création du mot de passe ne s'appliquent pas ici : elles peuvent évoluer.
export const logInRequestSchema = z.object({
  email: emailSchema,
  password: z
    .string('Le mot de passe est obligatoire')
    .min(1, 'Le mot de passe est obligatoire')
    .max(PASSWORD_MAX_LENGTH, 'Le mot de passe est trop long'),
});

export type LogInRequest = z.infer<typeof logInRequestSchema>;
