import type { ButtonHTMLAttributes, Ref } from 'react';
import { type ButtonVariant, getButtonClassName } from './button-styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`${getButtonClassName(variant)} ${className}`}
    />
  );
}
