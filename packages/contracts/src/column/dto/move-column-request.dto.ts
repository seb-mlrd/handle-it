import { z } from 'zod';

/** Voisines vues par le client à l'arrivée ; `null` désigne un bout du board. */
export const moveColumnRequestSchema = z.object({
  previousColumnId: z.uuid().nullable(),
  nextColumnId: z.uuid().nullable(),
});

export type MoveColumnRequest = z.infer<typeof moveColumnRequestSchema>;
