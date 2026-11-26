import type { CardResponse, CardSummaryResponse } from '@handle-it/contracts';
import type { Card } from './card.entity.js';

export function presentCardSummary(card: Card): CardSummaryResponse {
  return { id: card.getId(), title: card.getTitle() };
}

export function presentCard(card: Card): CardResponse {
  return { ...presentCardSummary(card), description: card.getDescription() };
}
