import type { ButtonHTMLAttributes, Ref } from 'react';

interface ColumnDragHandleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly name: string;
  readonly ref: Ref<HTMLButtonElement>;
}

export function ColumnDragHandle({ name, ...buttonProps }: ColumnDragHandleProps) {
  return (
    <button
      {...buttonProps}
      type="button"
      aria-label={`Déplacer la colonne ${name}`}
      className="flex size-11 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-control text-muted transition-colors hover:bg-canvas hover:text-ink motion-reduce:transition-none"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
        {[6, 12, 18].flatMap((y) =>
          [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />),
        )}
      </svg>
    </button>
  );
}
