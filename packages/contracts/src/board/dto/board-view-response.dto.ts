import { z } from 'zod';
import { cardSummaryResponseSchema } from '../../card/dto/card-response.dto.js';
import { labelResponseSchema } from '../../label/dto/label.dto.js';
import { columnResponseSchema } from '../../column/dto/column-response.dto.js';
import { boardResponseSchema } from './board-response.dto.js';

/** Carte telle qu'affichée dans son board : son résumé et les labels qui y sont posés. */
export const cardViewResponseSchema = cardSummaryResponseSchema.extend({
  labelIds: z.array(z.uuid()),
});

export type CardViewResponse = z.infer<typeof cardViewResponseSchema>;

export const columnViewResponseSchema = columnResponseSchema.extend({
  cards: z.array(cardViewResponseSchema),
});

export type ColumnViewResponse = z.infer<typeof columnViewResponseSchema>;

/** Board complet : colonnes et cartes dans leur ordre d'affichage. */
export const boardViewResponseSchema = boardResponseSchema.extend({
  version: z.int(),
  labels: z.array(labelResponseSchema),
  columns: z.array(columnViewResponseSchema),
});

export type BoardViewResponse = z.infer<typeof boardViewResponseSchema>;
