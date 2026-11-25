import type { InputHTMLAttributes, ReactNode } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldLayoutProps {
  /** Élément superposé à la fin du champ. */
  readonly trailing?: ReactNode;
}

export function TextField({ label, hint, errors, trailing, ...inputProps }: TextFieldProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      renderControl={(attributes) => (
        <div className="relative">
          <input
            {...inputProps}
            {...attributes}
            className={`h-11 w-full rounded-control border border-control bg-surface pl-3 text-base aria-invalid:border-danger ${trailing ? 'pr-12' : 'pr-3'}`}
          />
          {trailing}
        </div>
      )}
    />
  );
}
