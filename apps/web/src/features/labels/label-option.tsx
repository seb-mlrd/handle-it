import type { LabelResponse } from '@handle-it/contracts';
import { useEffect, useState } from 'react';
import { LabelChip } from './label-chip';

interface LabelOptionProps {
  readonly label: LabelResponse;
  readonly isChecked: boolean;
  readonly toggle: (isChecked: boolean) => void;
}

/** La case suit le clic aussitôt ; l'état enregistré la recale dès qu'il arrive. */
export function LabelOption({ label, isChecked, toggle }: LabelOptionProps) {
  const [isShownChecked, setIsShownChecked] = useState(isChecked);
  useEffect(() => setIsShownChecked(isChecked), [isChecked]);
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        className="size-5 accent-ink"
        checked={isShownChecked}
        onChange={(event) => {
          setIsShownChecked(event.target.checked);
          toggle(event.target.checked);
        }}
      />
      <LabelChip label={label} />
    </label>
  );
}
