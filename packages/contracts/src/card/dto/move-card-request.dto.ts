import { z } from 'zod';

/** Voisines vues par le client à l'arrivée ; `null` désigne un bout de la colonne. */
export const moveCardRequestSchema = z.object({
  columnId: z.uuid(),
  previousCardId: z.uuid().nullable(),
  nextCardId: z.uuid().nullable(),
});

export type MoveCardRequest = z.infer<typeof moveCardRequestSchema>;
