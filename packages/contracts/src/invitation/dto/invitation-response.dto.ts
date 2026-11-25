import { z } from 'zod';

export const invitationResponseSchema = z.object({
  id: z.uuid(),
  expiresAt: z.iso.datetime(),
});

export type InvitationResponse = z.infer<typeof invitationResponseSchema>;

export const invitationListResponseSchema = z.array(invitationResponseSchema);

/** Seule réponse qui contient le jeton : il n'est plus jamais lisible ensuite. */
export const createdInvitationResponseSchema = invitationResponseSchema.extend({
  token: z.string(),
});

export type CreatedInvitationResponse = z.infer<typeof createdInvitationResponseSchema>;
