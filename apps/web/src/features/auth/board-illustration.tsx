const COLUMNS = [
  ['h-16', 'h-24', 'h-14'],
  ['h-24', 'h-16 bg-accent!'],
  ['h-14', 'h-16', 'h-20'],
];

/** Décor : un tableau schématique dont une carte est en cours de traitement. */
export function BoardIllustration() {
  return (
    <div aria-hidden="true" className="grid w-full max-w-xl grid-cols-3 gap-4">
      {COLUMNS.map((cards, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3 rounded-card bg-canvas p-3">
          <div className="h-2 w-1/2 rounded-full bg-control" />
          {cards.map((classes, cardIndex) => (
            <div
              key={cardIndex}
              className={`rounded-control border border-line bg-surface ${classes}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
