import type { ButtonHTMLAttributes, Ref } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'px-4 bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'px-4 border border-control bg-surface hover:bg-canvas',
  ghost: 'px-2 text-sm text-muted hover:bg-canvas hover:text-ink',
  danger: 'px-4 bg-danger text-on-danger hover:opacity-90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant = 'primary', type = 'button', ...buttonProps }: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={`h-11 cursor-pointer rounded-control font-semibold transition-colors disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none ${VARIANT_CLASSES[variant]}`}
    />
  );
}
