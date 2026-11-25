import type { BoardRole } from '@handle-it/contracts';
import type { Board } from './board.entity.js';

/** Board accompagné du rôle de l'utilisateur qui le consulte. */
export interface BoardWithRole {
  readonly board: Board;
  readonly role: BoardRole;
}
