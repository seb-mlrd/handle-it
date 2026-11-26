import type { ActivityDetails } from '@handle-it/contracts';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardChanges } from '../board/board-changes.js';
import type { BoardEventPublisher } from '../board/board-event.publisher.js';
import { MemberNotFoundError } from './errors/member-not-found.error.js';
import type { Member } from './member.js';
import type { MemberRepository } from './member.repository.js';

/** Composition d'un board : qui en est membre. */
export class MemberService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly boardChanges: BoardChanges,
    private readonly boardEventPublisher: BoardEventPublisher,
  ) {}

  /** Liste les membres d'un board. */
  async list(userId: string, boardId: string): Promise<Member[]> {
    await this.boardAccessService.authorize(userId, boardId, 'view-board');
    return this.memberRepository.findAllByBoard(boardId);
  }

  /** Retire un autre membre, qui ne doit pas pouvoir revenir par un lien déjà reçu. */
  async remove(userId: string, boardId: string, memberId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'manage-members');
    await this.withdraw(boardId, userId, memberId, async () => {
      const memberName = await this.findName(boardId, memberId);
      await this.memberRepository.expel(boardId, memberId);
      return { type: 'member-removed', memberName };
    });
  }

  /** Quitte un board dont l'utilisateur est simple membre. */
  async leave(userId: string, boardId: string): Promise<void> {
    await this.boardAccessService.authorize(userId, boardId, 'leave-board');
    await this.withdraw(boardId, userId, userId, async () => {
      await this.memberRepository.remove(boardId, userId);
      return { type: 'member-left' };
    });
  }

  /** `removeMember` retire le membre et décrit ce qui s'est passé pour l'historique. */
  private async withdraw(
    boardId: string,
    actorId: string,
    memberId: string,
    removeMember: () => Promise<ActivityDetails>,
  ): Promise<void> {
    await this.boardChanges.run(boardId, actorId, async () => {
      const details = await removeMember();
      return {
        result: undefined,
        event: { type: 'members-changed' },
        activity: { cardId: null, details },
      };
    });
    this.boardEventPublisher.evict(boardId, memberId);
  }

  private async findName(boardId: string, userId: string): Promise<string> {
    const name = await this.memberRepository.findDisplayName(boardId, userId);
    if (name === null) {
      throw new MemberNotFoundError();
    }
    return name;
  }
}
