export const MAIN_CONTENT_ID = 'contenu';

/** Premier arrêt du clavier : passe l'en-tête pour aller au contenu. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="fixed top-2 left-2 z-50 -translate-y-24 rounded-control bg-accent px-4 py-2.5 font-semibold text-on-accent focus:translate-y-0"
    >
      Aller au contenu
    </a>
  );
}
