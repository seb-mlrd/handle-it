import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly hint?: string;
  /** Élément superposé à la fin du champ. */
  readonly trailing?: ReactNode;
  readonly errors?: readonly string[] | undefined;
}

export function TextField({ label, hint, trailing, errors = [], ...inputProps }: TextFieldProps) {
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
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          aria-invalid={isInvalid}
          aria-describedby={descriptions || undefined}
          className={`h-11 w-full rounded-control border border-control bg-surface pl-3 text-base aria-invalid:border-danger ${trailing ? 'pr-12' : 'pr-3'}`}
        />
        {trailing}
      </div>
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
