import { z } from 'zod';

const TOKEN_MAX_LENGTH = 100;

/** Le jeton voyage dans le corps : une adresse finirait dans les journaux des serveurs. */
export const invitationTokenRequestSchema = z.object({
  token: z.string().min(1).max(TOKEN_MAX_LENGTH),
});

export type InvitationTokenRequest = z.infer<typeof invitationTokenRequestSchema>;
