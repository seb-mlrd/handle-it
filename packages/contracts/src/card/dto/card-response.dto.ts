import { z } from 'zod';
import { dueDateSchema } from './due-date.dto.js';

/** Carte telle qu'affichée dans une colonne : la description n'est chargée qu'à l'ouverture. */
export const cardSummaryResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  dueOn: dueDateSchema.nullable(),
});

export type CardSummaryResponse = z.infer<typeof cardSummaryResponseSchema>;

export const cardResponseSchema = cardSummaryResponseSchema.extend({ description: z.string() });

export type CardResponse = z.infer<typeof cardResponseSchema>;
