import { z } from 'zod';
import { cardTitleSchema } from '../card-title-schema.js';

const CARD_DESCRIPTION_MAX_LENGTH = 5000;

export const updateCardRequestSchema = z.object({
  title: cardTitleSchema,
  description: z
    .string('La description est invalide')
    .trim()
    .max(
      CARD_DESCRIPTION_MAX_LENGTH,
      `La description est limitée à ${CARD_DESCRIPTION_MAX_LENGTH} caractères`,
    ),
});

export type UpdateCardRequest = z.infer<typeof updateCardRequestSchema>;
