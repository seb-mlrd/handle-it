import { useEffect, useRef } from 'react';

/**
 * Rend le focus au bouton qui a ouvert un panneau en ligne, une fois ce panneau refermé.
 * Sans cela, le bouton remonté après la fermeture n'a pas le focus : le clavier repart du haut de
 * la page.
 */
export function useReturnFocus<Trigger extends HTMLElement>(isOpen: boolean) {
  const triggerReference = useRef<Trigger>(null);
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current && !isOpen) triggerReference.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);
  return triggerReference;
}
