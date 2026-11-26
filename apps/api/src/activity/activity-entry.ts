import type { ActivityDetails } from '@handle-it/contracts';

/** Ce qu'une modification inscrit à l'historique ; l'auteur et la date sont ajoutés à l'écriture. */
export interface ActivityEntry {
  readonly cardId: string | null;
  readonly details: ActivityDetails;
}
