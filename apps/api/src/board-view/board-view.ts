import type { BoardWithRole } from '../board/board-with-role.js';
import type { CardSummary } from '../card/card-summary.js';
import type { Column } from '../column/column.entity.js';

export interface ColumnView {
  readonly column: Column;
  readonly cards: readonly CardSummary[];
}

/** Contenu complet d'un board, dans son ordre d'affichage. */
export interface BoardView extends BoardWithRole {
  readonly columns: readonly ColumnView[];
}
