import type { DueFilter } from '@handle-it/contracts';
import { SelectField } from '../../shared/ui/select-field';
import { DUE_FILTER_LABELS, readDueFilter } from './due-filter-options';

interface DueFilterSelectProps {
  readonly value: DueFilter | null;
  readonly change: (value: DueFilter | null) => void;
}

export function DueFilterSelect({ value, change }: DueFilterSelectProps) {
  return (
    <SelectField
      label="Échéance"
      value={value ?? ''}
      onChange={(event) => change(readDueFilter(event.target.value))}
    >
      <option value="">Toutes</option>
      {Object.entries(DUE_FILTER_LABELS).map(([filter, label]) => (
        <option key={filter} value={filter}>
          {label}
        </option>
      ))}
    </SelectField>
  );
}
