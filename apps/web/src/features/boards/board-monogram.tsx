import type { LabelColor } from '@handle-it/contracts';
import { LABEL_COLOR_CLASSES } from '../labels/label-colors';

// Le gris est écarté : il ressemblerait à un tableau désactivé.
const MONOGRAM_COLORS: readonly LabelColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'pink',
];

/** Couleur stable d'un tableau, tirée de son identifiant : elle ne change pas au renommage. */
function pickColor(boardId: string): LabelColor {
  let hash = 0;
  for (const character of boardId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length] ?? 'blue';
}

interface BoardMonogramProps {
  readonly boardId: string;
  readonly name: string;
}

/** Initiale du tableau dans sa couleur : repère visuel seulement, le nom est lu juste après. */
export function BoardMonogram({ boardId, name }: BoardMonogramProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 items-center justify-center rounded-control text-lg font-bold ${LABEL_COLOR_CLASSES[pickColor(boardId)]}`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
