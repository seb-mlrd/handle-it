import type { TextareaHTMLAttributes } from 'react';
import { FieldLayout, type FieldLayoutProps } from './field-layout';
import { FIELD_CLASS_NAME } from './field-styles';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldLayoutProps {}

export function TextArea({ label, hint, errors, ...textAreaProps }: TextAreaProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      errors={errors}
      renderControl={(attributes) => (
        <textarea {...textAreaProps} {...attributes} className={`px-3 py-2 ${FIELD_CLASS_NAME}`} />
      )}
    />
  );
}
