import type { CardResponse } from '@handle-it/contracts';
import type { Card } from './card.entity.js';

export function presentCard(card: Card): CardResponse {
  return { id: card.getId(), title: card.getTitle(), description: card.getDescription() };
}
