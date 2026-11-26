import {
  type ActivityPageRequest,
  activityPageRequestSchema,
  type ActivityPageResponse,
} from '@handle-it/contracts';
import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentActivityPage } from './activity.presenter.js';
import { ActivityService } from './activity.service.js';

const pagePipe = new ZodValidationPipe(activityPageRequestSchema);

@Controller('boards/:boardId')
export class ActivityController {
  constructor(@Inject(ActivityService) private readonly activityService: ActivityService) {}

  /** Historique du board, du plus récent au plus ancien. */
  @Get('activities')
  async listForBoard(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Query(pagePipe) request: ActivityPageRequest,
  ): Promise<ActivityPageResponse> {
    const page = await this.activityService.list(user.getId(), boardId, null, request);
    return presentActivityPage(page);
  }

  /** Historique d'une carte, du plus récent au plus ancien. */
  @Get('cards/:cardId/activities')
  async listForCard(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Query(pagePipe) request: ActivityPageRequest,
  ): Promise<ActivityPageResponse> {
    const page = await this.activityService.list(user.getId(), boardId, cardId, request);
    return presentActivityPage(page);
  }
}
