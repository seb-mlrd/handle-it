import {
  type CommentPageRequest,
  commentPageRequestSchema,
  type CommentPageResponse,
  type CommentRequest,
  commentRequestSchema,
  type CommentResponse,
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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentComment, presentCommentPage } from './comment.presenter.js';
import { CommentService } from './comment.service.js';

const commentRequestPipe = new ZodValidationPipe(commentRequestSchema);

@Controller('boards/:boardId')
export class CommentController {
  constructor(@Inject(CommentService) private readonly commentService: CommentService) {}

  /** Fil d'une carte, du plus ancien au plus récent. */
  @Get('cards/:cardId/comments')
  async list(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Query(new ZodValidationPipe(commentPageRequestSchema)) request: CommentPageRequest,
  ): Promise<CommentPageResponse> {
    const page = await this.commentService.list(user.getId(), boardId, cardId, request);
    return presentCommentPage(page);
  }

  /** Ajoute un commentaire à une carte. */
  @Post('cards/:cardId/comments')
  async add(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('cardId', uuidPipe) cardId: string,
    @Body(commentRequestPipe) request: CommentRequest,
  ): Promise<CommentResponse> {
    return presentComment(await this.commentService.add(user.getId(), boardId, cardId, request));
  }

  /** Modifie un de ses commentaires. */
  @Patch('comments/:commentId')
  async update(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('commentId', uuidPipe) commentId: string,
    @Body(commentRequestPipe) request: CommentRequest,
  ): Promise<CommentResponse> {
    const comment = await this.commentService.update(user.getId(), boardId, commentId, request);
    return presentComment(comment);
  }

  /** Supprime un commentaire. */
  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('commentId', uuidPipe) commentId: string,
  ): Promise<void> {
    await this.commentService.delete(user.getId(), boardId, commentId);
  }
}
