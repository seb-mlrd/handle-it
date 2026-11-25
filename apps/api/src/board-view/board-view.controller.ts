import type { BoardViewResponse } from '@handle-it/contracts';
import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentBoardView } from './board-view.presenter.js';
import { BoardViewService } from './board-view.service.js';

@Controller('boards/:boardId')
export class BoardViewController {
  constructor(@Inject(BoardViewService) private readonly boardViewService: BoardViewService) {}

  /** Renvoie un board avec ses colonnes et ses cartes. */
  @Get()
  async get(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<BoardViewResponse> {
    return presentBoardView(await this.boardViewService.get(user.getId(), boardId));
  }
}
