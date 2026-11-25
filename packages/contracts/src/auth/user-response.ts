import { z } from 'zod';

/** Données de l'utilisateur connecté, sans aucun champ sensible. */
export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
