import type { TextareaHTMLAttributes } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldLayoutProps {}

export function TextArea({ label, hint, errors, ...textAreaProps }: TextAreaProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      renderControl={(attributes) => (
        <textarea
          {...textAreaProps}
          {...attributes}
          className="w-full rounded-control border border-control bg-surface px-3 py-2 text-base aria-invalid:border-danger"
        />
      )}
    />
  );
}
