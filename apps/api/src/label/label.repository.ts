import type { Label } from './label.entity.js';

export abstract class LabelRepository {
  /** Lève `LabelNameTakenError` si le nom est déjà pris sur le board. */
  abstract add(label: Label): Promise<void>;
  /** Renvoie les labels du board par nom. */
  abstract findAllByBoard(boardId: string): Promise<Label[]>;
  abstract findById(boardId: string, labelId: string): Promise<Label | null>;
  /** Lève `LabelNotFoundError` ou `LabelNameTakenError`. */
  abstract update(label: Label): Promise<void>;
  /** Retire aussi le label de toutes les cartes ; lève `LabelNotFoundError`. */
  abstract delete(boardId: string, labelId: string): Promise<void>;
  /** Renvoie les labels posés sur chaque carte du board. */
  abstract findCardLabelIds(boardId: string): Promise<Map<string, string[]>>;
  /** Pose le label ; sans effet s'il l'est déjà. Renvoie les labels de la carte après coup. */
  abstract attach(cardId: string, labelId: string): Promise<string[]>;
  /** Retire le label ; sans effet s'il ne l'est pas. Renvoie les labels de la carte après coup. */
  abstract detach(cardId: string, labelId: string): Promise<string[]>;
}
