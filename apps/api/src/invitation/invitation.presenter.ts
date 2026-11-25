import type { InvitationResponse } from '@handle-it/contracts';
import type { Invitation } from './invitation.entity.js';

export function presentInvitation(invitation: Invitation): InvitationResponse {
  return { id: invitation.getId(), expiresAt: invitation.getExpiresAt().toISOString() };
}
