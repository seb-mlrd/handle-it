import type { BoardViewResponse } from '@handle-it/contracts';
import { presentBoard } from '../board/board.presenter.js';
import { presentLabel } from '../label/label.presenter.js';
import { presentColumn } from '../column/column.presenter.js';
import type { BoardView } from './board-view.js';

export function presentBoardView(view: BoardView): BoardViewResponse {
  return {
    ...presentBoard(view),
    version: view.board.getVersion(),
    labels: view.labels.map(presentLabel),
    columns: view.columns.map(({ column, cards }) => ({
      ...presentColumn(column),
      cards: cards.map(({ id, title, dueOn, labelIds, commentCount }) => ({
        id,
        title,
        dueOn,
        labelIds: [...labelIds],
        commentCount,
      })),
    })),
  };
}
