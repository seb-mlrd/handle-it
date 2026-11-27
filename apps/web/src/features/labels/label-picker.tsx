import type { BoardViewResponse } from '@handle-it/contracts';
import { Link } from 'react-router';
import { getErrorMessage } from '../../shared/http/error-message';
import { useBoardLabels, useLoadedBoard, useSetCardLabel } from '../board-view/use-board-content';
import { LabelOption } from './label-option';

interface LabelPickerProps {
  readonly boardId: string;
  readonly cardId: string;
}

function findCardLabelIds(board: BoardViewResponse, cardId: string): readonly string[] {
  const card = board.columns.flatMap(({ cards }) => cards).find(({ id }) => id === cardId);
  return card?.labelIds ?? [];
}

/** Cases à cocher des labels du board ; chaque clic pose ou retire aussitôt. */
export function LabelPicker({ boardId, cardId }: LabelPickerProps) {
  const { data: labels = [] } = useBoardLabels(boardId);
  const { data: labelIds = [] } = useLoadedBoard(boardId, (board) =>
    findCardLabelIds(board, cardId),
  );
  const setCardLabel = useSetCardLabel(boardId, cardId);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-headline font-semibold">Labels</legend>
      {labels.length === 0 ? (
        <p className="text-muted">
          Ce tableau n'a pas encore de label.{' '}
          <Link to={`/boards/${boardId}/labels`} className="font-semibold text-ink underline">
            Créer un label
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {labels.map((label) => (
            <li key={label.id}>
              <LabelOption
                label={label}
                isChecked={labelIds.includes(label.id)}
                toggle={(isAttached) => setCardLabel.mutate({ labelId: label.id, isAttached })}
              />
            </li>
          ))}
        </ul>
      )}
      <span role="alert" className="text-sm text-danger">
        {setCardLabel.error && getErrorMessage(setCardLabel.error)}
      </span>
    </fieldset>
  );
}
