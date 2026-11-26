import type { ActivityDetails } from '@handle-it/contracts';

/** Entrée d'historique telle qu'elle est lue. */
export class Activity {
  constructor(
    private readonly id: string,
    private readonly actorName: string | null,
    private readonly cardId: string | null,
    private readonly createdAt: Date,
    private readonly details: ActivityDetails,
  ) {}

  getId(): string {
    return this.id;
  }

  /** `null` quand le compte de l'auteur a été supprimé. */
  getActorName(): string | null {
    return this.actorName;
  }

  getCardId(): string | null {
    return this.cardId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getDetails(): ActivityDetails {
    return this.details;
  }
}
