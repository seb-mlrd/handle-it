import { LabelChip } from './label-chip';
import { useBoardLabels } from '../board-view/use-board-content';

interface CardLabelsProps {
  readonly boardId: string;
  readonly labelIds: readonly string[];
}

/** Pastilles d'une carte, dans l'ordre des labels du board. */
export function CardLabels({ boardId, labelIds }: CardLabelsProps) {
  const { data: labels = [] } = useBoardLabels(boardId);
  const shown = labels.filter(({ id }) => labelIds.includes(id));
  if (shown.length === 0) return null;
  return (
    <ul aria-label="Labels" className="mt-2 flex flex-wrap gap-1">
      {shown.map((label) => (
        <li key={label.id} className="max-w-full">
          <LabelChip label={label} />
        </li>
      ))}
    </ul>
  );
}
