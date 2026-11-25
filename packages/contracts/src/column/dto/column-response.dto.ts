import { z } from 'zod';

export const columnResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export type ColumnResponse = z.infer<typeof columnResponseSchema>;

/** Colonnes d'un board, dans leur ordre d'affichage. */
export const columnListResponseSchema = z.array(columnResponseSchema);
