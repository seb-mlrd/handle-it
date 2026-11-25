/** Aperçu d'une carte dans sa colonne, sans sa description. */
export interface CardSummary {
  readonly id: string;
  readonly columnId: string;
  readonly title: string;
}
