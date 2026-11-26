import type { ActivityPageRequest } from '@handle-it/contracts';
import type { BoardAccessService } from '../board/board-access.service.js';
import { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { ActivityPage } from './activity-page.js';
import type { ActivityRepository } from './activity.repository.js';

const PAGE_SIZE = 30;

/** Lecture de l'historique d'un board ou d'une carte. */
export class ActivityService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  /** Renvoie une page d'historique ; `cardId` la limite à une carte, même supprimée. */
  async list(
    userId: string,
    boardId: string,
    cardId: string | null,
    request: ActivityPageRequest,
  ): Promise<ActivityPage> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    const before = request.before ? CreationCursor.decode(request.before) : null;
    return this.activityRepository.findPage({ boardId, cardId, before, limit: PAGE_SIZE });
  }
}
