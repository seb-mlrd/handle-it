import type { BoardResponse } from '@handle-it/contracts';
import type { BoardWithRole } from './board-with-role.js';

export function presentBoard({ board, role }: BoardWithRole): BoardResponse {
  return { id: board.getId(), name: board.getName(), role };
}
