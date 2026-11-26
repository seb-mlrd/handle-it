import type { LabelColor } from '@handle-it/contracts';

export class Label {
  constructor(
    private readonly id: string,
    private readonly boardId: string,
    private readonly name: string,
    private readonly color: LabelColor,
  ) {}

  getId(): string {
    return this.id;
  }

  getBoardId(): string {
    return this.boardId;
  }

  getName(): string {
    return this.name;
  }

  getColor(): LabelColor {
    return this.color;
  }

  /** Clé de comparaison : « Urgent » et « urgent » sont le même nom. */
  getNameKey(): string {
    return this.name.toLocaleLowerCase('fr-FR');
  }
}
