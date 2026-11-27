import type { DropAnimation } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { readEasing } from '../../shared/motion/read-easing';

/** Agrandissement de la copie saisie, rendu à 1 pendant qu'elle se pose. */
export const LIFT_SCALE = 1.03;

const DROP_DURATION_MILLISECONDS = 380;

/**
 * Dépose : la copie rejoint sa place avec un léger rebond, car le geste lui a donné de l'élan, et
 * perd son agrandissement en chemin.
 */
export function createDropAnimation(): DropAnimation {
  return {
    duration: DROP_DURATION_MILLISECONDS,
    easing: readEasing('--ease-spring-bounce'),
    keyframes: ({ transform: { initial, final } }) => [
      { transform: CSS.Transform.toString(initial) },
      {
        transform: CSS.Transform.toString({
          ...final,
          scaleX: final.scaleX / LIFT_SCALE,
          scaleY: final.scaleY / LIFT_SCALE,
        }),
      },
    ],
  };
}
