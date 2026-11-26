import type { ActivityPageResponse } from '@handle-it/contracts';
import type { ActivityPage } from './activity-page.js';

export function presentActivityPage({ items, next }: ActivityPage): ActivityPageResponse {
  return {
    items: items.map((activity) => ({
      id: activity.getId(),
      actorName: activity.getActorName(),
      cardId: activity.getCardId(),
      createdAt: activity.getCreatedAt().toISOString(),
      details: activity.getDetails(),
    })),
    nextCursor: next?.encode() ?? null,
  };
}
