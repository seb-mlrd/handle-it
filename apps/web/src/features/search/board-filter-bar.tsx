import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { TextField } from '../../shared/ui/text-field';
import { useBoardLabels } from '../board-view/use-board-content';
import { LabelChip } from '../labels/label-chip';
import { type BoardFilter, EMPTY_BOARD_FILTER } from './board-filter';
import { DueFilterSelect } from './due-filter-select';

interface BoardFilterBarProps {
  readonly boardId: string;
  readonly filter: BoardFilter;
  readonly change: (filter: BoardFilter) => void;
  readonly isActive: boolean;
  readonly shownCount: number;
  readonly totalCount: number;
  readonly textError: unknown;
}

/** Filtres du board ouvert : les cartes qui ne correspondent pas sont masquées. */
export function BoardFilterBar(props: BoardFilterBarProps) {
  const { filter, change } = props;
  const { data: labels = [] } = useBoardLabels(props.boardId);
  const toggleLabel = (labelId: string, isChecked: boolean) =>
    change({
      ...filter,
      labelIds: isChecked
        ? [...filter.labelIds, labelId]
        : filter.labelIds.filter((id) => id !== labelId),
    });
  return (
    <section aria-label="Filtres" className="flex flex-wrap items-end gap-4 px-6">
      <div className="w-64">
        <TextField
          label="Filtrer les cartes"
          type="search"
          autoComplete="off"
          value={filter.text}
          onChange={(event) => change({ ...filter, text: event.target.value })}
          errors={props.textError ? [getErrorMessage(props.textError)] : undefined}
        />
      </div>
      <div className="w-48">
        <DueFilterSelect value={filter.due} change={(due) => change({ ...filter, due })} />
      </div>
      {labels.length > 0 && (
        <details className="relative">
          <summary className="flex h-11 cursor-pointer items-center rounded-control border border-control bg-surface px-4 font-semibold">
            Filtrer par label{filter.labelIds.length > 0 ? ` (${filter.labelIds.length})` : ''}
          </summary>
          <fieldset className="absolute z-10 mt-1 flex w-64 flex-col gap-1 rounded-card border border-line bg-surface p-3 shadow-overlay">
            <legend className="sr-only">Labels à afficher</legend>
            {labels.map((label) => (
              <label key={label.id} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-ink"
                  checked={filter.labelIds.includes(label.id)}
                  onChange={(event) => toggleLabel(label.id, event.target.checked)}
                />
                <LabelChip label={label} />
              </label>
            ))}
          </fieldset>
        </details>
      )}
      {props.isActive && (
        <Button variant="secondary" onClick={() => change(EMPTY_BOARD_FILTER)}>
          Effacer les filtres
        </Button>
      )}
      <p role="status" className="flex h-11 items-center text-muted">
        {props.isActive && `Cartes affichées : ${props.shownCount} sur ${props.totalCount}`}
      </p>
    </section>
  );
}
