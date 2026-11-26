import type { LabelResponse } from '@handle-it/contracts';
import { LABEL_COLOR_CLASSES } from './label-colors';

interface LabelChipProps {
  readonly label: LabelResponse;
}

export function LabelChip({ label }: LabelChipProps) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full px-2 py-0.5 text-sm font-medium wrap-anywhere ${LABEL_COLOR_CLASSES[label.color]}`}
    >
      {label.name}
    </span>
  );
}
