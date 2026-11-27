import type { SelectHTMLAttributes } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';
import { FIELD_CLASS_NAME } from './field-styles';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldLayoutProps {}

export function SelectField({
  label,
  hint,
  errors,
  isLabelHidden,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      isLabelHidden={isLabelHidden}
      renderControl={(attributes) => (
        <select
          {...selectProps}
          {...attributes}
          className={`h-11 cursor-pointer px-3 ${FIELD_CLASS_NAME}`}
        />
      )}
    />
  );
}
