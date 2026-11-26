import type { KeyboardEvent } from 'react';

/** Ctrl+Entrée (⌘+Entrée sur Mac) envoie le formulaire ; Entrée seule reste un retour à la ligne. */
export function submitOnShortcut(event: KeyboardEvent<HTMLTextAreaElement>): void {
  if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}
