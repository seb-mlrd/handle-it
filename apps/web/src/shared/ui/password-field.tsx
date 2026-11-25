import { useState } from 'react';
import { EyeIcon } from './eye-icon';
import { TextField, type TextFieldProps } from './text-field';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

/** Champ de mot de passe dont la saisie peut être affichée. */
export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      trailing={
        <button
          type="button"
          aria-label={`${isVisible ? 'Masquer' : 'Afficher'} le champ « ${props.label} »`}
          onClick={() => setIsVisible(!isVisible)}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-control text-muted transition-colors hover:text-ink motion-reduce:transition-none"
        >
          <EyeIcon isCrossed={isVisible} />
        </button>
      }
    />
  );
}
