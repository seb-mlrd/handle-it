import { z } from 'zod';
import { cardSummaryResponseSchema } from '../../card/dto/card-response.dto.js';
import { columnResponseSchema } from '../../column/dto/column-response.dto.js';
import { boardResponseSchema } from './board-response.dto.js';

export const columnViewResponseSchema = columnResponseSchema.extend({
  cards: z.array(cardSummaryResponseSchema),
});

export type ColumnViewResponse = z.infer<typeof columnViewResponseSchema>;

/** Board complet : colonnes et cartes dans leur ordre d'affichage. */
export const boardViewResponseSchema = boardResponseSchema.extend({
  columns: z.array(columnViewResponseSchema),
});

export type BoardViewResponse = z.infer<typeof boardViewResponseSchema>;
