import type { BoardViewResponse } from '@handle-it/contracts';
import { presentBoard } from '../board/board.presenter.js';
import { presentColumn } from '../column/column.presenter.js';
import type { BoardView } from './board-view.js';

export function presentBoardView(view: BoardView): BoardViewResponse {
  return {
    ...presentBoard(view),
    columns: view.columns.map(({ column, cards }) => ({
      ...presentColumn(column),
      cards: cards.map(({ id, title }) => ({ id, title })),
    })),
  };
}
