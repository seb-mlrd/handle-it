import type { BoardWithRole } from '../board/board-with-role.js';
import type { CardSummary } from '../card/card-summary.js';
import type { Label } from '../label/label.entity.js';
import type { Column } from '../column/column.entity.js';

/** Carte d'une colonne, avec les labels qui y sont posés et son nombre de commentaires. */
export interface CardView extends CardSummary {
  readonly labelIds: readonly string[];
  readonly commentCount: number;
}

export interface ColumnView {
  readonly column: Column;
  readonly cards: readonly CardView[];
}

/** Contenu complet d'un board, dans son ordre d'affichage. */
export interface BoardView extends BoardWithRole {
  readonly labels: readonly Label[];
  readonly columns: readonly ColumnView[];
}
