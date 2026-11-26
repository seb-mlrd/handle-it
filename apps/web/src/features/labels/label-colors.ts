import type { LabelColor } from '@handle-it/contracts';

/** Nom de chaque couleur, lu à côté de la pastille : la couleur n'est jamais seule à parler. */
export const LABEL_COLOR_NAMES: Record<LabelColor, string> = {
  gray: 'Gris',
  red: 'Rouge',
  orange: 'Orange',
  yellow: 'Jaune',
  green: 'Vert',
  teal: 'Turquoise',
  blue: 'Bleu',
  pink: 'Rose',
};

/** Classes écrites en entier : Tailwind ne repère pas les noms de classe construits. */
export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  gray: 'bg-label-gray text-on-label-gray',
  red: 'bg-label-red text-on-label-red',
  orange: 'bg-label-orange text-on-label-orange',
  yellow: 'bg-label-yellow text-on-label-yellow',
  green: 'bg-label-green text-on-label-green',
  teal: 'bg-label-teal text-on-label-teal',
  blue: 'bg-label-blue text-on-label-blue',
  pink: 'bg-label-pink text-on-label-pink',
};
