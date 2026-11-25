import type { Membership } from '../board/membership.entity.js';
import type { Invitation } from './invitation.entity.js';

export abstract class InvitationRepository {
  /** Lève `BoardNotFoundError` si le board a disparu. */
  abstract add(invitation: Invitation): Promise<void>;
  abstract findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  /** Renvoie les invitations encore valables, de la plus proche de l'expiration à la plus lointaine. */
  abstract findActiveByBoard(boardId: string, now: Date): Promise<Invitation[]>;
  /**
   * Consomme l'invitation et ajoute le membre, ensemble ou pas du tout. Sans effet pour un membre
   * existant. Lève `InvitationInvalidError` si elle vient d'être utilisée.
   */
  abstract accept(invitation: Invitation, member: Membership): Promise<void>;
  abstract deleteExpired(now: Date): Promise<void>;
}
