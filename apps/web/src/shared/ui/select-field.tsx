import type { SelectHTMLAttributes } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldLayoutProps {}

export function SelectField({ label, hint, errors, ...selectProps }: SelectFieldProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      renderControl={(attributes) => (
        <select
          {...selectProps}
          {...attributes}
          className="h-11 w-full rounded-control border border-control bg-surface px-3 text-base aria-invalid:border-danger"
        />
      )}
    />
  );
}
