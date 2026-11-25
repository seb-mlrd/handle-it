import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardRepository } from '../board/board.repository.js';
import { BoardNotFoundError } from '../board/errors/board-not-found.error.js';
import type { CardRepository } from '../card/card.repository.js';
import type { ColumnRepository } from '../column/column.repository.js';
import type { BoardView } from './board-view.js';

/** Assemble un board, ses colonnes et ses cartes pour l'affichage. */
export class BoardViewService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly columnRepository: ColumnRepository,
    private readonly cardRepository: CardRepository,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  /** Renvoie le contenu du board si l'utilisateur en est membre. */
  async get(userId: string, boardId: string): Promise<BoardView> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'view-board');
    const [board, columns, cards] = await Promise.all([
      this.boardRepository.findById(boardId),
      this.columnRepository.findAllByBoard(boardId),
      this.cardRepository.findSummariesByBoard(boardId),
    ]);
    if (!board) {
      throw new BoardNotFoundError();
    }
    const cardsByColumn = Map.groupBy(cards, (card) => card.columnId);
    return {
      board,
      role: membership.getRole(),
      columns: columns.map((column) => ({
        column,
        cards: cardsByColumn.get(column.getId()) ?? [],
      })),
    };
  }
}
