import { z } from 'zod';
import { boardRoleSchema } from '../../board/dto/board-response.dto.js';

/** Membre d'un board ; l'adresse e-mail n'est pas partagée entre membres. */
export const memberResponseSchema = z.object({
  userId: z.uuid(),
  displayName: z.string(),
  role: boardRoleSchema,
});

export type MemberResponse = z.infer<typeof memberResponseSchema>;

export const memberListResponseSchema = z.array(memberResponseSchema);
