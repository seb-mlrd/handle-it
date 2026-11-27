/** Logo : trois colonnes dont la dernière est avancée, comme une carte qui vient d'y arriver. */
export function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-start justify-center gap-0.5 rounded-[0.45rem] bg-accent p-1.5 shadow-raised"
    >
      <span className="h-3 w-1 rounded-full bg-on-accent/80" />
      <span className="h-4 w-1 rounded-full bg-on-accent/80" />
      <span className="h-2.5 w-1 rounded-full bg-on-accent" />
    </span>
  );
}
