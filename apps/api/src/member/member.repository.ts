import type { Member } from './member.js';

export abstract class MemberRepository {
  /** Renvoie l'owner en premier, puis les membres par nom. */
  abstract findAllByBoard(boardId: string): Promise<Member[]>;
  /**
   * Retire un simple membre et annule les invitations du board, dans une modification du board ;
   * lève `MemberNotFoundError` si ce n'est pas un simple membre.
   */
  abstract expel(boardId: string, userId: string): Promise<void>;
  /** Retire un simple membre ; lève `MemberNotFoundError` sinon, owner compris. */
  abstract remove(boardId: string, userId: string): Promise<void>;
}
