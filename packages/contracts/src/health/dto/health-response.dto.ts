import { z } from 'zod';

/** Réponse publique de la route de santé, sans détail interne sur les pannes. */
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
