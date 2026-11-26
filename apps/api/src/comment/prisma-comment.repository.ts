import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '../database/transaction-context.js';
import type { Prisma } from '../generated/prisma/client.js';
import { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { CommentPage } from './comment-page.js';
import { Comment } from './comment.entity.js';
import { CommentRepository, type CommentQuery } from './comment.repository.js';
import { CommentNotFoundError } from './errors/comment-not-found.error.js';

/** L'appartenance de l'auteur au board décide si son nom s'affiche encore. */
const selectCommentFields = (boardId: string) =>
  ({
    id: true,
    cardId: true,
    authorId: true,
    body: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: { displayName: true, memberships: { where: { boardId }, select: { role: true } } },
    },
  }) as const;

type CommentRecord = Prisma.CommentGetPayload<{
  select: ReturnType<typeof selectCommentFields>;
}>;

@Injectable()
export class PrismaCommentRepository extends CommentRepository {
  constructor(@Inject(TransactionContext) private readonly transactionContext: TransactionContext) {
    super();
  }

  override async add(comment: Comment): Promise<void> {
    await this.client().comment.create({
      data: {
        id: comment.getId(),
        cardId: comment.getCardId(),
        authorId: comment.getAuthorId(),
        body: comment.getBody(),
        createdAt: comment.getCreatedAt(),
      },
      select: { id: true },
    });
  }

  override async findById(boardId: string, commentId: string): Promise<Comment | null> {
    const record = await this.client().comment.findFirst({
      where: { id: commentId, card: { column: { boardId } } },
      select: selectCommentFields(boardId),
    });
    return record && this.toComment(record);
  }

  override async findPage(query: CommentQuery): Promise<CommentPage> {
    // Un commentaire de plus que demandé indique qu'une page suivante existe.
    const records = await this.client().comment.findMany({
      where: this.buildWhere(query),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: query.limit + 1,
      select: selectCommentFields(query.boardId),
    });
    const items = records.slice(0, query.limit).map((record) => this.toComment(record));
    const last = items.at(-1);
    const hasMore = records.length > query.limit;
    return {
      items,
      next: hasMore && last ? CreationCursor.after(last.getCreatedAt(), last.getId()) : null,
    };
  }

  override async update(comment: Comment): Promise<void> {
    const { count } = await this.client().comment.updateMany({
      where: { id: comment.getId() },
      data: { body: comment.getBody(), updatedAt: comment.getUpdatedAt() },
    });
    if (count === 0) throw new CommentNotFoundError();
  }

  override async delete(commentId: string): Promise<void> {
    const { count } = await this.client().comment.deleteMany({ where: { id: commentId } });
    if (count === 0) throw new CommentNotFoundError();
  }

  override countOnCard(cardId: string): Promise<number> {
    return this.client().comment.count({ where: { cardId } });
  }

  override async countByBoard(boardId: string): Promise<Map<string, number>> {
    const groups = await this.client().comment.groupBy({
      by: ['cardId'],
      where: { card: { column: { boardId } } },
      _count: { _all: true },
    });
    return new Map(groups.map(({ cardId, _count }) => [cardId, _count._all]));
  }

  private buildWhere({ boardId, cardId, after }: CommentQuery): Prisma.CommentWhereInput {
    const scope = { cardId, card: { column: { boardId } } };
    if (!after) return scope;
    const createdAt = after.getCreatedAt();
    return {
      ...scope,
      OR: [{ createdAt: { gt: createdAt } }, { createdAt, id: { gt: after.getId() } }],
    };
  }

  private client() {
    return this.transactionContext.getClient();
  }

  private toComment(record: CommentRecord): Comment {
    const isStillMember = (record.author?.memberships.length ?? 0) > 0;
    const authorName = isStillMember ? (record.author?.displayName ?? null) : null;
    return new Comment(
      record.id,
      record.cardId,
      record.authorId,
      authorName,
      record.body,
      record.createdAt,
      record.updatedAt,
    );
  }
}
