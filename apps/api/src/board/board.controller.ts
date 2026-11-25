import { type BoardRequest, type BoardResponse, boardRequestSchema } from '@handle-it/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentBoard } from './board.presenter.js';
import { BoardService } from './board.service.js';

const boardRequestPipe = new ZodValidationPipe(boardRequestSchema);

@Controller('boards')
export class BoardController {
  constructor(@Inject(BoardService) private readonly boardService: BoardService) {}

  /** Crée un board. */
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body(boardRequestPipe) request: BoardRequest,
  ): Promise<BoardResponse> {
    return presentBoard(await this.boardService.create(user.getId(), request));
  }

  /** Liste les boards de l'utilisateur connecté. */
  @Get()
  async list(@CurrentUser() user: User): Promise<BoardResponse[]> {
    return (await this.boardService.list(user.getId())).map(presentBoard);
  }

  /** Renomme un board. */
  @Patch(':boardId')
  async rename(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Body(boardRequestPipe) request: BoardRequest,
  ): Promise<BoardResponse> {
    return presentBoard(await this.boardService.rename(user.getId(), boardId, request));
  }

  /** Supprime un board et tout son contenu. */
  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<void> {
    await this.boardService.delete(user.getId(), boardId);
  }
}
