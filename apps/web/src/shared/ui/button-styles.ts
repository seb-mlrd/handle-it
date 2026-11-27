export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BASE_CLASSES =
  'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,scale] select-none disabled:cursor-default disabled:opacity-60 motion-safe:active:scale-[0.97] motion-safe:active:duration-100 motion-reduce:transition-none';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'px-4 bg-accent text-on-accent shadow-raised hover:bg-accent-strong',
  secondary: 'px-4 bg-surface text-ink shadow-raised hover:bg-canvas',
  ghost: 'px-3 text-sm text-muted hover:bg-ink/6 hover:text-ink',
  danger: 'px-4 bg-danger text-on-danger shadow-raised hover:opacity-90',
};

/**
 * Classes d'un bouton, partagées avec les liens qui en ont l'apparence. Le retour arrive dès
 * l'appui (`active`), sans attendre le relâchement.
 */
export function getButtonClassName(variant: ButtonVariant): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`;
}
