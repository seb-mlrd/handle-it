/** Déplacement demandé : l'élément et ses futurs voisins, `null` désignant un bout de la liste. */
export interface RankPlacement {
  readonly itemId: string;
  readonly previousItemId: string | null;
  readonly nextItemId: string | null;
}
