import {
  type CreatedInvitationResponse,
  type CreateInvitationRequest,
  createInvitationRequestSchema,
  type InvitationResponse,
} from '@handle-it/contracts';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import { ZodValidationPipe } from '../shared/http/zod-validation.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentInvitation } from './invitation.presenter.js';
import { InvitationService } from './invitation.service.js';

/** Invitations vues par l'owner du board. */
@Controller('boards/:boardId/invitations')
export class BoardInvitationController {
  constructor(@Inject(InvitationService) private readonly invitationService: InvitationService) {}

  /** Crée une invitation ; son jeton n'est renvoyé qu'ici. */
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Body(new ZodValidationPipe(createInvitationRequestSchema)) request: CreateInvitationRequest,
  ): Promise<CreatedInvitationResponse> {
    const { invitation, token } = await this.invitationService.create(
      user.getId(),
      boardId,
      request,
    );
    return { ...presentInvitation(invitation), token };
  }

  /** Liste les invitations encore valables. */
  @Get()
  async list(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<InvitationResponse[]> {
    return (await this.invitationService.list(user.getId(), boardId)).map(presentInvitation);
  }
}
