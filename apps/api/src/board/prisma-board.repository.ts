import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import { Board } from './board.entity.js';
import { BoardRepository } from './board.repository.js';
import type { BoardWithRole } from './board-with-role.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';
import { Membership } from './membership.entity.js';

@Injectable()
export class PrismaBoardRepository extends BoardRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(board: Board, creator: Membership): Promise<void> {
    // Une création imbriquée s'exécute dans une seule transaction.
    await this.transactionContext.getClient().board.create({
      data: {
        id: board.getId(),
        name: board.getName(),
        memberships: { create: { userId: creator.getUserId(), role: creator.getRole() } },
      },
      select: { id: true },
    });
  }

  override async findAllByUser(userId: string): Promise<BoardWithRole[]> {
    const records = await this.transactionContext.getClient().membership.findMany({
      where: { userId },
      orderBy: [{ board: { createdAt: 'desc' } }, { boardId: 'asc' }],
      select: { role: true, board: { select: { id: true, name: true } } },
    });
    return records.map(({ board, role }) => ({ board: new Board(board.id, board.name), role }));
  }

  override async findById(boardId: string): Promise<Board | null> {
    const record = await this.transactionContext.getClient().board.findUnique({
      where: { id: boardId },
      select: { name: true, version: true },
    });
    return record && new Board(boardId, record.name, record.version);
  }

  override async findMembership(boardId: string, userId: string): Promise<Membership | null> {
    const record = await this.transactionContext.getClient().membership.findUnique({
      where: { boardId_userId: { boardId, userId } },
      select: { role: true },
    });
    return record && new Membership(boardId, userId, record.role);
  }

  override async addMember(membership: Membership): Promise<void> {
    await this.transactionContext.getClient().membership.create({
      data: {
        boardId: membership.getBoardId(),
        userId: membership.getUserId(),
        role: membership.getRole(),
      },
      select: { userId: true },
    });
  }

  override async update(board: Board): Promise<void> {
    const { count } = await this.transactionContext.getClient().board.updateMany({
      where: { id: board.getId() },
      data: { name: board.getName() },
    });
    if (count === 0) {
      throw new BoardNotFoundError();
    }
  }

  override async delete(boardId: string): Promise<void> {
    await this.transactionContext.getClient().board.deleteMany({ where: { id: boardId } });
  }
}
