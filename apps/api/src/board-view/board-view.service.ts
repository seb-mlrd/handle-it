import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardChanges } from '../board/board-changes.js';
import type { BoardRepository } from '../board/board.repository.js';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import type { CardRepository } from '../card/card.repository.js';
import type { LabelRepository } from '../label/label.repository.js';
import type { ColumnRepository } from '../column/column.repository.js';
import type { BoardView } from './board-view.js';

/** Assemble un board, ses colonnes et ses cartes pour l'affichage. */
export class BoardViewService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly columnRepository: ColumnRepository,
    private readonly cardRepository: CardRepository,
    private readonly labelRepository: LabelRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly boardChanges: BoardChanges,
  ) {}

  /** Renvoie le contenu du board si l'utilisateur en est membre. */
  async get(userId: string, boardId: string): Promise<BoardView> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'view-board');
    // Un même état pour tout : la version doit correspondre exactement au contenu.
    const [board, columns, cards, labels, labelIdsByCard] =
      await this.boardChanges.readConsistently(() =>
        Promise.all([
          this.boardRepository.findById(boardId),
          this.columnRepository.findAllByBoard(boardId),
          this.cardRepository.findSummariesByBoard(boardId),
          this.labelRepository.findAllByBoard(boardId),
          this.labelRepository.findCardLabelIds(boardId),
        ]),
      );
    if (!board) {
      throw new BoardNotFoundError();
    }
    const cardsByColumn = Map.groupBy(cards, (card) => card.columnId);
    return {
      board,
      role: membership.getRole(),
      labels,
      columns: columns.map((column) => ({
        column,
        cards: (cardsByColumn.get(column.getId()) ?? []).map((card) => ({
          ...card,
          labelIds: labelIdsByCard.get(card.id) ?? [],
        })),
      })),
    };
  }
}
