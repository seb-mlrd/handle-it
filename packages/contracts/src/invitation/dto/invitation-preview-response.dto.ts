import { z } from 'zod';

/** Ce qu'un invité voit avant d'accepter. */
export const invitationPreviewResponseSchema = z.object({ boardName: z.string() });

export type InvitationPreviewResponse = z.infer<typeof invitationPreviewResponseSchema>;
