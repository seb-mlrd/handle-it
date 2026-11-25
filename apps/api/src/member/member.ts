import type { BoardRole } from '@handle-it/contracts';

/** Membre d'un board, avec le nom affiché aux autres. */
export interface Member {
  readonly userId: string;
  readonly displayName: string;
  readonly role: BoardRole;
}
