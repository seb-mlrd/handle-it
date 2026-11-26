import { type LabelRequest, labelRequestSchema, type LabelResponse } from '@handle-it/contracts';
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
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentLabel } from './label.presenter.js';
import { LabelService } from './label.service.js';

const labelRequestPipe = new ZodValidationPipe(labelRequestSchema);

@Controller('boards/:boardId')
export class LabelController {
  constructor(@Inject(LabelService) private readonly labelService: LabelService) {}

  /** Liste les labels du board. */
  @Get('labels')
  async list(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<LabelResponse[]> {
    return (await this.labelService.list(user.getId(), boardId)).map(presentLabel);
  }

  /** Crée un label. */
  @Post('labels')
  async create(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Body(labelRequestPipe) request: LabelRequest,
  ): Promise<LabelResponse> {
    return presentLabel(await this.labelService.create(user.getId(), boardId, request));
  }

  /** Renomme ou recolore un label. */
  @Patch('labels/:labelId')
  async update(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('labelId', uuidPipe) labelId: string,
    @Body(labelRequestPipe) request: LabelRequest,
  ): Promise<LabelResponse> {
    return presentLabel(await this.labelService.update(user.getId(), boardId, labelId, request));
  }

  /** Supprime un label et le retire de toutes les cartes. */
  @Delete('labels/:labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('labelId', uuidPipe) labelId: string,
  ): Promise<void> {
    await this.labelService.delete(user.getId(), boardId, labelId);
  }

  /** Pose un label sur une carte ; renvoie les labels de la carte. */
  @Put('cards/:cardId/labels/:labelId')
  attach(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Param('labelId', uuidPipe) labelId: string,
  ): Promise<string[]> {
    return this.labelService.setOnCard(user.getId(), boardId, cardId, labelId, true);
  }

  /** Retire un label d'une carte ; renvoie les labels de la carte. */
  @Delete('cards/:cardId/labels/:labelId')
  detach(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Param('labelId', uuidPipe) labelId: string,
  ): Promise<string[]> {
    return this.labelService.setOnCard(user.getId(), boardId, cardId, labelId, false);
  }
}
