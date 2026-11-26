import { z } from 'zod';
import { cardSummaryResponseSchema } from '../../card/dto/card-response.dto.js';
import { columnResponseSchema } from '../../column/dto/column-response.dto.js';

/** Élément qui précède dans la liste ; `null` désigne le début. */
const previousIdSchema = z.uuid().nullable();

/** Modification d'un board, suffisante pour mettre à jour l'écran sans relire le board. */
export const boardEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('board-renamed'), name: z.string() }),
  z.object({ type: z.literal('board-deleted') }),
  z.object({ type: z.literal('members-changed') }),
  z.object({ type: z.literal('column-created'), column: columnResponseSchema }),
  z.object({ type: z.literal('column-renamed'), column: columnResponseSchema }),
  z.object({ type: z.literal('column-deleted'), columnId: z.uuid() }),
  z.object({
    type: z.literal('column-moved'),
    columnId: z.uuid(),
    previousColumnId: previousIdSchema,
  }),
  z.object({
    type: z.literal('card-created'),
    columnId: z.uuid(),
    card: cardSummaryResponseSchema,
  }),
  z.object({ type: z.literal('card-updated'), card: cardSummaryResponseSchema }),
  z.object({ type: z.literal('card-deleted'), cardId: z.uuid() }),
  z.object({
    type: z.literal('card-moved'),
    cardId: z.uuid(),
    columnId: z.uuid(),
    previousCardId: previousIdSchema,
  }),
]);

export type BoardEvent = z.infer<typeof boardEventSchema>;

/** Les versions d'un board se suivent sans trou : une version manquante impose de le relire. */
export const boardEventEnvelopeSchema = z.object({
  boardId: z.uuid(),
  version: z.int(),
  event: boardEventSchema,
});

export type BoardEventEnvelope = z.infer<typeof boardEventEnvelopeSchema>;
