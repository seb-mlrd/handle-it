import {
  type BoardResponse,
  type InvitationPreviewResponse,
  type InvitationTokenRequest,
  invitationTokenRequestSchema,
} from '@handle-it/contracts';
import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { presentBoard } from '../board/board.presenter.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { InvitationService } from './invitation.service.js';

const tokenPipe = new ZodValidationPipe(invitationTokenRequestSchema);

/** Invitations vues par l'invité, qui doit être connecté. */
@Controller('invitations')
export class InvitationController {
  constructor(@Inject(InvitationService) private readonly invitationService: InvitationService) {}

  /** Décrit l'invitation sans la consommer. */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @Body(tokenPipe) { token }: InvitationTokenRequest,
  ): Promise<InvitationPreviewResponse> {
    return { boardName: (await this.invitationService.preview(token)).getName() };
  }

  /** Rejoint le board. */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: User,
    @Body(tokenPipe) { token }: InvitationTokenRequest,
  ): Promise<BoardResponse> {
    return presentBoard(await this.invitationService.accept(user.getId(), token));
  }
}
