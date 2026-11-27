import { getErrorMessage } from '../../shared/http/error-message';
import { Button } from '../../shared/ui/button';
import { getButtonClassName } from '../../shared/ui/button-styles';
import { Icon } from '../../shared/ui/icon';
import { TextField } from '../../shared/ui/text-field';
import { useDismissibleDetails } from '../../shared/ui/use-dismissible-details';
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
  const labelMenuReference = useDismissibleDetails();
  const toggleLabel = (labelId: string, isChecked: boolean) =>
    change({
      ...filter,
      labelIds: isChecked
        ? [...filter.labelIds, labelId]
        : filter.labelIds.filter((id) => id !== labelId),
    });
  return (
    <section aria-label="Filtres" className="flex flex-wrap items-start gap-2 px-6">
      <div className="w-full sm:w-64">
        <TextField
          label="Filtrer les cartes"
          isLabelHidden
          placeholder="Filtrer les cartes"
          leading={
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
            />
          }
          type="search"
          autoComplete="off"
          value={filter.text}
          onChange={(event) => change({ ...filter, text: event.target.value })}
          errors={props.textError ? [getErrorMessage(props.textError)] : undefined}
        />
      </div>
      <div className="w-full sm:w-52">
        <DueFilterSelect
          value={filter.due}
          isLabelHidden
          change={(due) => change({ ...filter, due })}
        />
      </div>
      {labels.length > 0 && (
        <details ref={labelMenuReference} className="relative">
          <summary
            className={`${getButtonClassName('secondary')} list-none [&::-webkit-details-marker]:hidden`}
          >
            Filtrer par label{filter.labelIds.length > 0 ? ` (${filter.labelIds.length})` : ''}
            <Icon
              name="chevronDown"
              className="size-4 text-muted transition-transform in-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <fieldset className="absolute z-30 mt-1 flex w-64 flex-col gap-0.5 rounded-card bg-surface p-1.5 shadow-overlay">
            <legend className="sr-only">Labels à afficher</legend>
            {labels.map((label) => (
              <label
                key={label.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 transition-colors hover:bg-ink/6 motion-reduce:transition-none"
              >
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
        <Button variant="ghost" onClick={() => change(EMPTY_BOARD_FILTER)}>
          Effacer les filtres
        </Button>
      )}
      <p role="status" className="flex h-11 items-center text-sm text-muted">
        {props.isActive && `Cartes affichées : ${props.shownCount} sur ${props.totalCount}`}
      </p>
    </section>
  );
}
