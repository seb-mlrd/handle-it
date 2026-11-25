import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'border border-control bg-surface hover:bg-canvas',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
}

export function Button({ variant = 'primary', type = 'button', ...buttonProps }: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`h-11 cursor-pointer rounded-control px-4 font-semibold transition-colors disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none ${VARIANT_CLASSES[variant]}`}
    />
  );
}
