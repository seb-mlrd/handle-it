import type { BoardAccessService } from '../board/board-access.service.js';
import type { Member } from './member.js';
import type { MemberRepository } from './member.repository.js';

/** Composition d'un board : qui en est membre. */
export class MemberService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  /** Liste les membres d'un board. */
  async list(userId: string, boardId: string): Promise<Member[]> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    return this.memberRepository.findAllByBoard(boardId);
  }

  /** Retire un autre membre, qui ne doit pas pouvoir revenir par un lien déjà reçu. */
  async remove(userId: string, boardId: string, memberId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'manage-members');
    await this.memberRepository.expel(boardId, memberId);
  }

  /** Quitte un board dont l'utilisateur est simple membre. */
  async leave(userId: string, boardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'leave-board');
    await this.memberRepository.remove(boardId, userId);
  }
}
