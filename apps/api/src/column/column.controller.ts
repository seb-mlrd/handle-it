import {
  type ColumnRequest,
  columnRequestSchema,
  type ColumnResponse,
  type MoveColumnRequest,
  moveColumnRequestSchema,
} from '@handle-it/contracts';
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
import { presentColumn } from './column.presenter.js';
import { ColumnService } from './column.service.js';

const columnRequestPipe = new ZodValidationPipe(columnRequestSchema);

@Controller('boards/:boardId/columns')
export class ColumnController {
  constructor(@Inject(ColumnService) private readonly columnService: ColumnService) {}

  /** Liste les colonnes d'un board, dans leur ordre d'affichage. */
  @Get()
  async list(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<ColumnResponse[]> {
    return (await this.columnService.list(user.getId(), boardId)).map(presentColumn);
  }

  /** Ajoute une colonne à la fin du board. */
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Body(columnRequestPipe) request: ColumnRequest,
  ): Promise<ColumnResponse> {
    return presentColumn(await this.columnService.create(user.getId(), boardId, request));
  }

  /** Renomme une colonne. */
  @Patch(':columnId')
  async rename(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('columnId', uuidPipe) columnId: string,
    @Body(columnRequestPipe) request: ColumnRequest,
  ): Promise<ColumnResponse> {
    return presentColumn(await this.columnService.rename(user.getId(), boardId, columnId, request));
  }

  /** Déplace une colonne. */
  @Patch(':columnId/position')
  @HttpCode(HttpStatus.NO_CONTENT)
  async move(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('columnId', uuidPipe) columnId: string,
    @Body(new ZodValidationPipe(moveColumnRequestSchema)) request: MoveColumnRequest,
  ): Promise<void> {
    await this.columnService.move(user.getId(), boardId, columnId, request);
  }

  /** Supprime une colonne. */
  @Delete(':columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('columnId', uuidPipe) columnId: string,
  ): Promise<void> {
    await this.columnService.delete(user.getId(), boardId, columnId);
  }
}
