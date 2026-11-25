import { z } from 'zod';

const EMAIL_MAX_LENGTH = 254;
const INVALID_EMAIL_MESSAGE = "L'adresse e-mail est invalide";

export const emailSchema = z
  .string(INVALID_EMAIL_MESSAGE)
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, INVALID_EMAIL_MESSAGE)
  .pipe(z.email(INVALID_EMAIL_MESSAGE));
