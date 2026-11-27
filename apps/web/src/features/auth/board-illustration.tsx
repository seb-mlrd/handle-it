import type { LabelColor } from '@handle-it/contracts';
import { LABEL_COLOR_CLASSES } from '../labels/label-colors';

interface SampleCard {
  readonly title: string;
  readonly label?: { readonly name: string; readonly color: LabelColor };
  readonly due?: string;
}

const COLUMNS: readonly { readonly name: string; readonly cards: readonly SampleCard[] }[] = [
  {
    name: 'À faire',
    cards: [
      { title: 'Réserver la salle', label: { name: 'Équipe', color: 'blue' } },
      { title: 'Relire le devis', due: 'Vendredi' },
      { title: 'Commander les badges' },
    ],
  },
  {
    name: 'En cours',
    cards: [
      { title: 'Préparer les slides', label: { name: 'Urgent', color: 'red' }, due: 'Demain' },
    ],
  },
  {
    name: 'Fait',
    cards: [
      { title: 'Envoyer les invitations', label: { name: 'Équipe', color: 'blue' } },
      { title: 'Choisir le traiteur' },
    ],
  },
];

function SampleCardView({ card }: { readonly card: SampleCard }) {
  return (
    <div className="rounded-control bg-raised px-3 py-2.5 text-sm shadow-raised">
      {card.title}
      {(card.label || card.due) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.label && (
            <span
              className={`rounded-full px-2 text-xs leading-5 font-medium ${LABEL_COLOR_CLASSES[card.label.color]}`}
            >
              {card.label.name}
            </span>
          )}
          {card.due && (
            <span className="rounded-full bg-label-gray px-2 text-xs leading-5 font-medium text-on-label-gray">
              {card.due}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Décor : un vrai tableau en miniature, dont une carte est soulevée en plein déplacement. */
export function BoardIllustration() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-xl select-none">
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((column) => (
          <div key={column.name} className="flex flex-col gap-2 rounded-card bg-well p-2">
            <p className="flex items-center justify-between px-1.5 py-1 text-sm font-semibold">
              {column.name}
              <span className="rounded-full bg-ink/6 px-1.5 text-xs leading-5 text-muted">
                {column.cards.length}
              </span>
            </p>
            {column.cards.map((card) => (
              <SampleCardView key={card.title} card={card} />
            ))}
          </div>
        ))}
      </div>
      {/* La carte qui passe de « En cours » à « Fait », saisie au vol. */}
      <div className="absolute top-[64%] left-[50%] w-[31%] scale-[1.03] rounded-control shadow-overlay ring-2 ring-accent">
        <SampleCardView card={{ title: 'Valider le budget', due: "Aujourd'hui" }} />
      </div>
    </div>
  );
}
