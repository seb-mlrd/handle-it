import type { MemberResponse } from '@handle-it/contracts';
import { Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { uuidPipe } from '../shared/http/uuid.pipe.js';
import type { User } from '../user/user.entity.js';
import { presentMember } from './member.presenter.js';
import { MemberService } from './member.service.js';

@Controller('boards/:boardId')
export class MemberController {
  constructor(@Inject(MemberService) private readonly memberService: MemberService) {}

  /** Liste les membres d'un board. */
  @Get('members')
  async list(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<MemberResponse[]> {
    return (await this.memberService.list(user.getId(), boardId)).map(presentMember);
  }

  /** Retire un membre. */
  @Delete('members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
    @Param('memberId', uuidPipe) memberId: string,
  ): Promise<void> {
    await this.memberService.remove(user.getId(), boardId, memberId);
  }

  /** Quitte le board. */
  @Delete('membership')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @CurrentUser() user: User,
    @Param('boardId', uuidPipe) boardId: string,
  ): Promise<void> {
    await this.memberService.leave(user.getId(), boardId);
  }
}
