import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import { type BoardChange, BoardChanges } from './board-changes.js';
import { BoardEventPublisher } from './board-event.publisher.js';
import { BoardNotFoundError } from './errors/board-not-found.error.js';

@Injectable()
export class PrismaBoardChanges extends BoardChanges {
  constructor(
    @Inject(TransactionContext) private readonly transactionContext: TransactionContext,
    @Inject(BoardEventPublisher) private readonly boardEventPublisher: BoardEventPublisher,
  ) {
    super();
  }

  override async run<Result>(
    boardId: string,
    change: () => Promise<BoardChange<Result>>,
  ): Promise<Result> {
    const { version, result, event } = await this.transactionContext.run(async () => {
      // Incrémenter d'abord verrouille le board : les modifications suivantes attendent leur tour.
      const nextVersion = await this.incrementVersion(boardId);
      return { version: nextVersion, ...(await change()) };
    });
    this.boardEventPublisher.publish({ boardId, version, event });
    return result;
  }

  override readConsistently<Result>(read: () => Promise<Result>): Promise<Result> {
    return this.transactionContext.runSnapshot(read);
  }

  private async incrementVersion(boardId: string): Promise<number> {
    const [board] = await this.transactionContext.getClient().board.updateManyAndReturn({
      where: { id: boardId },
      data: { version: { increment: 1 } },
      select: { version: true },
    });
    if (!board) {
      throw new BoardNotFoundError();
    }
    return board.version;
  }
}
