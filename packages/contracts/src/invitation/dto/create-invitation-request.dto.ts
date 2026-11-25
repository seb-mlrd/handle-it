import { z } from 'zod';

const DURATION_ERROR = 'Choisis une durée de validité';

export const invitationDurationSchema = z.enum(
  ['one-hour', 'one-day', 'seven-days'],
  DURATION_ERROR,
);

export type InvitationDuration = z.infer<typeof invitationDurationSchema>;

export const createInvitationRequestSchema = z.object({ duration: invitationDurationSchema });

export type CreateInvitationRequest = z.infer<typeof createInvitationRequestSchema>;
