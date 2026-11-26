import { type RefObject, useEffect } from 'react';

/** Vrai quand la touche tapée sert déjà à écrire, ou qu'une fenêtre modale occupe l'écran. */
function isTyping(target: EventTarget | null): boolean {
  if (document.querySelector('dialog[open]')) return true;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** La touche « / » place le curseur dans le champ, comme sur la plupart des sites. */
export function useSlashShortcut(fieldReference: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    const focusField = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      fieldReference.current?.focus();
    };
    document.addEventListener('keydown', focusField);
    return () => document.removeEventListener('keydown', focusField);
  }, [fieldReference]);
}
