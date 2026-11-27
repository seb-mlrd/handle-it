import { useEffect, useRef } from 'react';

/**
 * Referme un menu `<details>` comme un menu ordinaire : Échap (le focus revient sur son titre) ou un
 * clic en dehors. Le navigateur ne le fait pas de lui-même.
 */
export function useDismissibleDetails() {
  const detailsReference = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = () => detailsReference.current?.removeAttribute('open');
    const closeOnEscape = (event: KeyboardEvent) => {
      const details = detailsReference.current;
      if (event.key !== 'Escape' || !details?.open) return;
      close();
      details.querySelector('summary')?.focus();
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      const details = detailsReference.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) close();
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, []);
  return detailsReference;
}
