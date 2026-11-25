import { z } from 'zod';

export const boardRoleSchema = z.enum(['owner', 'member']);

export type BoardRole = z.infer<typeof boardRoleSchema>;

/** Board tel que le voit l'utilisateur connecté, avec son propre rôle. */
export const boardResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: boardRoleSchema,
});

export type BoardResponse = z.infer<typeof boardResponseSchema>;

export const boardListResponseSchema = z.array(boardResponseSchema);
