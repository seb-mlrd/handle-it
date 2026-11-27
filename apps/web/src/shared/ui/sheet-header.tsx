import { Button } from './button';

interface SheetHeaderProps {
  readonly titleId: string;
  readonly title: string;
  readonly closeLabel?: string;
  readonly close: () => void;
}

/**
 * En-tête d'un panneau latéral : reste visible pendant le défilement, sur un matériau translucide
 * qui laisse deviner le contenu passé dessous plutôt qu'un trait de séparation.
 */
export function SheetHeader({ titleId, title, closeLabel = 'Fermer', close }: SheetHeaderProps) {
  return (
    <div className="material sticky top-0 z-10 -mx-6 mb-3 flex items-center justify-between gap-4 px-6 pt-4 pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-0.75rem),transparent)]">
      <h2 id={titleId} className="text-title font-bold">
        {title}
      </h2>
      <Button variant="secondary" onClick={close}>
        {closeLabel}
      </Button>
    </div>
  );
}
