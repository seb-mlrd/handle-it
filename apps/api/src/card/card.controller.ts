import {
  type CardResponse,
  type CreateCardRequest,
  createCardRequestSchema,
  type UpdateCardRequest,
  updateCardRequestSchema,
  type MoveCardRequest,
  moveCardRequestSchema,
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
import { presentCard } from './card.presenter.js';
import { CardService } from './card.service.js';

@Controller('boards/:boardId')
export class CardController {
  constructor(@Inject(CardService) private readonly cardService: CardService) {}

  /** Ajoute une carte à la fin d'une colonne. */
  @Post('columns/:columnId/cards')
  async create(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('columnId', uuidPipe) columnId: string,
    @Body(new ZodValidationPipe(createCardRequestSchema)) request: CreateCardRequest,
  ): Promise<CardResponse> {
    return presentCard(await this.cardService.create(user.getId(), boardId, columnId, request));
  }

  /** Renvoie une carte avec sa description. */
  @Get('cards/:cardId')
  async get(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
  ): Promise<CardResponse> {
    return presentCard(await this.cardService.get(user.getId(), boardId, cardId));
  }

  /** Modifie le titre et la description d'une carte. */
  @Patch('cards/:cardId')
  async update(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Body(new ZodValidationPipe(updateCardRequestSchema)) request: UpdateCardRequest,
  ): Promise<CardResponse> {
    return presentCard(await this.cardService.update(user.getId(), boardId, cardId, request));
  }

  /** Déplace une carte. */
  @Patch('cards/:cardId/position')
  @HttpCode(HttpStatus.NO_CONTENT)
  async move(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Body(new ZodValidationPipe(moveCardRequestSchema)) request: MoveCardRequest,
  ): Promise<void> {
    await this.cardService.move(user.getId(), boardId, cardId, request);
  }

  /** Supprime une carte. */
  @Delete('cards/:cardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
  ): Promise<void> {
    await this.cardService.delete(user.getId(), boardId, cardId);
  }
}
