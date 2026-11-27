import type { LabelResponse } from '@handle-it/contracts';
import { LABEL_COLOR_CLASSES } from './label-colors';

interface LabelChipProps {
  readonly label: LabelResponse;
}

export function LabelChip({ label }: LabelChipProps) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full px-2 text-[0.8125rem] leading-5 font-medium tracking-[0.01em] wrap-anywhere ${LABEL_COLOR_CLASSES[label.color]}`}
    >
      {label.name}
    </span>
  );
}
