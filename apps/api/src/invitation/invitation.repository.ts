import type { Invitation } from './invitation.entity.js';

export abstract class InvitationRepository {
  /** Lève `BoardNotFoundError` si le board a disparu. */
  abstract add(invitation: Invitation): Promise<void>;
  abstract findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  /** Renvoie les invitations encore valables, de la plus proche de l'expiration à la plus lointaine. */
  abstract findActiveByBoard(boardId: string, now: Date): Promise<Invitation[]>;
  /** Supprime l'invitation ; lève `InvitationInvalidError` si elle vient d'être utilisée ou annulée. */
  abstract consume(invitation: Invitation): Promise<void>;
  abstract deleteExpired(now: Date): Promise<void>;
}
