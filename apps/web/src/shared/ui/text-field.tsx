import type { InputHTMLAttributes, ReactNode } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';
import { FIELD_CLASS_NAME } from './field-styles';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldLayoutProps {
  /** Élément superposé au début du champ, comme une icône. */
  readonly leading?: ReactNode;
  /** Élément superposé à la fin du champ. */
  readonly trailing?: ReactNode;
}

export function TextField({
  label,
  hint,
  errors,
  isLabelHidden,
  leading,
  trailing,
  ...inputProps
}: TextFieldProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      isLabelHidden={isLabelHidden}
      renderControl={(attributes) => (
        <div className="relative">
          <input
            {...inputProps}
            {...attributes}
            className={`h-11 ${FIELD_CLASS_NAME} ${leading ? 'pl-10' : 'pl-3'} ${trailing ? 'pr-12' : 'pr-3'}`}
          />
          {leading}
          {trailing}
        </div>
      )}
    />
  );
}
