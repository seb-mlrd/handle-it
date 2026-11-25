import type { Invitation } from './invitation.entity.js';

/** Invitation qui vient d'être créée : seul moment où son jeton est lisible. */
export interface CreatedInvitation {
  readonly invitation: Invitation;
  readonly token: string;
}
