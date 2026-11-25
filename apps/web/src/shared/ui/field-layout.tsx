import { type ReactNode, useId } from 'react';

export interface FieldLayoutProps {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly errors?: readonly string[] | undefined;
}

interface ControlAttributes {
  readonly id: string;
  readonly 'aria-invalid': boolean;
  readonly 'aria-describedby': string | undefined;
}

interface FieldLayoutWithControlProps extends FieldLayoutProps {
  readonly renderControl: (attributes: ControlAttributes) => ReactNode;
}

/** Relie un champ à son libellé, son aide et son erreur. */
export function FieldLayout({
  label,
  hint,
  errors = [],
  renderControl,
}: FieldLayoutWithControlProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const isInvalid = errors.length > 0;
  const descriptions = [hint && hintId, isInvalid && errorId].filter(Boolean).join(' ');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {renderControl({
        id,
        'aria-invalid': isInvalid,
        'aria-describedby': descriptions || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {isInvalid && (
        <p id={errorId} className="text-sm text-danger">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
