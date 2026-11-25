import { randomUUID } from 'node:crypto';
import type { CreateInvitationRequest, InvitationDuration } from '@handle-it/contracts';
import type { Board } from '../board/board.entity.js';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardRepository } from '../board/board.repository.js';
import type { BoardWithRole } from '../board/board-with-role.js';
import { Membership } from '../board/membership.entity.js';
import type { TokenService } from '../shared/security/token.service.js';
import type { Clock } from '../shared/time/clock.js';
import type { CreatedInvitation } from './created-invitation.js';
import { InvitationInvalidError } from './errors/invitation-invalid.error.js';
import { Invitation } from './invitation.entity.js';
import type { InvitationRepository } from './invitation.repository.js';

const HOUR_MILLISECONDS = 60 * 60 * 1000;
const DAY_MILLISECONDS = 24 * HOUR_MILLISECONDS;

const MILLISECONDS_BY_DURATION: Record<InvitationDuration, number> = {
  'one-hour': HOUR_MILLISECONDS,
  'one-day': DAY_MILLISECONDS,
  'seven-days': 7 * DAY_MILLISECONDS,
};

/** Cycle de vie des invitations : création et acceptation. */
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly boardRepository: BoardRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly tokenService: TokenService,
    private readonly clock: Clock,
  ) {}

  /** Crée un lien à usage unique et renvoie son jeton. */
  async create(
    userId: string,
    boardId: string,
    request: CreateInvitationRequest,
  ): Promise<CreatedInvitation> {
    await this.boardAccessService.authorize(userId, boardId, 'manage-members');
    const now = this.clock.now();
    const token = this.tokenService.generate();
    const expiresAt = new Date(now.getTime() + MILLISECONDS_BY_DURATION[request.duration]);
    const tokenHash = this.tokenService.hash(token);
    const invitation = new Invitation(randomUUID(), boardId, tokenHash, expiresAt);
    // Purge opportuniste, comme pour les sessions.
    await this.invitationRepository.deleteExpired(now);
    await this.invitationRepository.add(invitation);
    return { invitation, token };
  }

  /** Liste les invitations encore valables d'un board. */
  async list(userId: string, boardId: string): Promise<Invitation[]> {
    await this.boardAccessService.authorize(userId, boardId, 'manage-members');
    return this.invitationRepository.findActiveByBoard(boardId, this.clock.now());
  }

  /** Renvoie le board auquel un jeton donne accès, sans consommer l'invitation. */
  async preview(token: string): Promise<Board> {
    return this.findBoard(await this.findValid(token));
  }

  /** Rejoint le board ; un membre existant garde son rôle et l'invitation reste utilisable. */
  async accept(userId: string, token: string): Promise<BoardWithRole> {
    const invitation = await this.findValid(token);
    const board = await this.findBoard(invitation);
    const current = await this.boardRepository.findMembership(board.getId(), userId);
    if (current) {
      return { board, role: current.getRole() };
    }
    const member = new Membership(board.getId(), userId, 'member');
    await this.invitationRepository.accept(invitation, member);
    return { board, role: member.getRole() };
  }

  private async findValid(token: string): Promise<Invitation> {
    const tokenHash = this.tokenService.hash(token);
    const invitation = await this.invitationRepository.findByTokenHash(tokenHash);
    if (!invitation || invitation.isExpired(this.clock.now())) {
      throw new InvitationInvalidError();
    }
    return invitation;
  }

  private async findBoard(invitation: Invitation): Promise<Board> {
    const board = await this.boardRepository.findById(invitation.getBoardId());
    if (!board) {
      throw new InvitationInvalidError();
    }
    return board;
  }
}
