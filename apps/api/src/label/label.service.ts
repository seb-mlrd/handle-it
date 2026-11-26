import { randomUUID } from 'node:crypto';
import type { LabelRequest } from '@handle-it/contracts';
import type { ActivityEntry } from '../activity/activity-entry.js';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardChanges } from '../board/board-changes.js';
import type { CardRepository } from '../card/card.repository.js';
import { CardNotFoundError } from '../card/errors/card-not-found.error.js';
import { LabelNotFoundError } from './errors/label-not-found.error.js';
import { Label } from './label.entity.js';
import { presentLabel } from './label.presenter.js';
import type { LabelRepository } from './label.repository.js';

type LabelActivityType = 'label-created' | 'label-updated' | 'label-deleted';

function describeLabel(type: LabelActivityType, label: Label): ActivityEntry {
  return { cardId: null, details: { type, labelName: label.getName() } };
}

/** Labels d'un board, et leur pose sur les cartes. */
export class LabelService {
  constructor(
    private readonly labelRepository: LabelRepository,
    private readonly cardRepository: CardRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly boardChanges: BoardChanges,
  ) {}

  /** Liste les labels du board. */
  async list(userId: string, boardId: string): Promise<Label[]> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    return this.labelRepository.findAllByBoard(boardId);
  }

  async create(userId: string, boardId: string, request: LabelRequest): Promise<Label> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    const label = new Label(randomUUID(), boardId, request.name, request.color);
    return this.boardChanges.run(boardId, userId, async () => {
      await this.labelRepository.add(label);
      return {
        result: label,
        event: { type: 'label-created', label: presentLabel(label) },
        activity: describeLabel('label-created', label),
      };
    });
  }

  /** Renomme ou recolore un label. */
  async update(
    userId: string,
    boardId: string,
    labelId: string,
    request: LabelRequest,
  ): Promise<Label> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    const label = new Label(labelId, boardId, request.name, request.color);
    return this.boardChanges.run(boardId, userId, async () => {
      await this.labelRepository.update(label);
      return {
        result: label,
        event: { type: 'label-updated', label: presentLabel(label) },
        activity: describeLabel('label-updated', label),
      };
    });
  }

  /** Supprime un label, retiré du même coup de toutes ses cartes. */
  async delete(userId: string, boardId: string, labelId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    await this.boardChanges.run(boardId, userId, async () => {
      const label = await this.findLabel(boardId, labelId);
      await this.labelRepository.delete(boardId, labelId);
      return {
        result: undefined,
        event: { type: 'label-deleted', labelId },
        activity: describeLabel('label-deleted', label),
      };
    });
  }

  /** Pose (`isAttached` vrai) ou retire un label d'une carte du même board. */
  async setOnCard(
    userId: string,
    boardId: string,
    cardId: string,
    labelId: string,
    isAttached: boolean,
  ): Promise<string[]> {
    await this.boardAccessService.authorize(userId, boardId, 'edit-content');
    return this.boardChanges.run(boardId, userId, async () => {
      const label = await this.findLabel(boardId, labelId);
      const card = await this.cardRepository.find(boardId, cardId);
      if (!card) throw new CardNotFoundError();
      const labelIds = isAttached
        ? await this.labelRepository.attach(cardId, labelId)
        : await this.labelRepository.detach(cardId, labelId);
      const type = isAttached ? 'card-label-added' : 'card-label-removed';
      return {
        result: labelIds,
        event: { type: 'card-labels-changed', cardId, labelIds },
        activity: {
          cardId,
          details: { type, cardTitle: card.getTitle(), labelName: label.getName() },
        },
      };
    });
  }

  private async findLabel(boardId: string, labelId: string): Promise<Label> {
    const label = await this.labelRepository.findById(boardId, labelId);
    if (!label) throw new LabelNotFoundError();
    return label;
  }
}
