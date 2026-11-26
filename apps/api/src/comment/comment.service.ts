import { randomUUID } from 'node:crypto';
import type { CommentPageRequest, CommentRequest } from '@handle-it/contracts';
import type { BoardAccessPolicy } from '../board/board-access-policy.js';
import type { BoardAccessService } from '../board/board-access.service.js';
import type { BoardChange, BoardChanges } from '../board/board-changes.js';
import type { Membership } from '../board/membership.entity.js';
import type { Card } from '../card/card.entity.js';
import type { CardRepository } from '../card/card.repository.js';
import { CardNotFoundError } from '../card/errors/card-not-found.error.js';
import { CreationCursor } from '../shared/pagination/creation-cursor.js';
import type { Clock } from '../shared/time/clock.js';
import { Comment } from './comment.entity.js';
import type { CommentRepository } from './comment.repository.js';
import { CommentNotFoundError } from './errors/comment-not-found.error.js';
import type { ReadableComment, ReadableCommentPage } from './readable-comment.js';

const PAGE_SIZE = 30;

type CommentActivityType = 'comment-added' | 'comment-updated' | 'comment-deleted';

/** Fil de commentaires des cartes d'un board. */
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cardRepository: CardRepository,
    private readonly boardAccessService: BoardAccessService,
    private readonly boardAccessPolicy: BoardAccessPolicy,
    private readonly boardChanges: BoardChanges,
    private readonly clock: Clock,
  ) {}

  /** Renvoie une page du fil d'une carte, du plus ancien au plus récent. */
  async list(
    userId: string,
    boardId: string,
    cardId: string,
    request: CommentPageRequest,
  ): Promise<ReadableCommentPage> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'view-board');
    await this.findCard(boardId, cardId);
    const after = request.after ? CreationCursor.decode(request.after) : null;
    const page = await this.commentRepository.findPage({
      boardId,
      cardId,
      after,
      limit: PAGE_SIZE,
    });
    return {
      items: page.items.map((comment) => this.toReadable(membership, comment)),
      nextCursor: page.next?.encode() ?? null,
    };
  }

  /** Ajoute un commentaire à la fin du fil d'une carte. */
  async add(
    userId: string,
    boardId: string,
    cardId: string,
    request: CommentRequest,
  ): Promise<ReadableComment> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'comment');
    return this.boardChanges.run(boardId, userId, async () => {
      const card = await this.findCard(boardId, cardId);
      const id = randomUUID();
      await this.commentRepository.add(
        Comment.write(id, cardId, userId, request.body, this.clock.now()),
      );
      // Relu pour obtenir le nom de l'auteur tel que les autres le verront.
      const comment = await this.findComment(boardId, id);
      return this.describe(card, 'comment-added', this.toReadable(membership, comment));
    });
  }

  /** Change le texte d'un commentaire ; réservé à son auteur. */
  async update(
    userId: string,
    boardId: string,
    commentId: string,
    request: CommentRequest,
  ): Promise<ReadableComment> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'comment');
    return this.boardChanges.run(boardId, userId, async () => {
      const comment = await this.findComment(boardId, commentId);
      this.boardAccessPolicy.authorizeOnComment(
        membership,
        'edit-comment',
        comment.isWrittenBy(userId),
      );
      const edited = comment.edit(request.body, this.clock.now());
      await this.commentRepository.update(edited);
      const card = await this.findCard(boardId, comment.getCardId());
      return this.describe(card, 'comment-updated', this.toReadable(membership, edited));
    });
  }

  /** Supprime un commentaire ; permis à son auteur et à l'owner du board. */
  async delete(userId: string, boardId: string, commentId: string): Promise<void> {
    const membership = await this.boardAccessService.authorize(userId, boardId, 'comment');
    await this.boardChanges.run(boardId, userId, async () => {
      const comment = await this.findComment(boardId, commentId);
      this.boardAccessPolicy.authorizeOnComment(
        membership,
        'delete-comment',
        comment.isWrittenBy(userId),
      );
      await this.commentRepository.delete(commentId);
      const card = await this.findCard(boardId, comment.getCardId());
      return this.describe(card, 'comment-deleted', undefined);
    });
  }

  /** L'événement ne porte que le nombre : le texte reste hors du temps réel et de l'historique. */
  private async describe<Result>(
    card: Card,
    type: CommentActivityType,
    result: Result,
  ): Promise<BoardChange<Result>> {
    const cardId = card.getId();
    const commentCount = await this.commentRepository.countOnCard(cardId);
    return {
      result,
      event: { type: 'card-comments-changed', cardId, commentCount },
      activity: { cardId, details: { type, cardTitle: card.getTitle() } },
    };
  }

  private toReadable(membership: Membership, comment: Comment): ReadableComment {
    const isAuthor = comment.isWrittenBy(membership.getUserId());
    const policy = this.boardAccessPolicy;
    return {
      comment,
      canEdit: policy.isAllowedOnComment(membership, 'edit-comment', isAuthor),
      canDelete: policy.isAllowedOnComment(membership, 'delete-comment', isAuthor),
    };
  }

  private async findCard(boardId: string, cardId: string): Promise<Card> {
    const card = await this.cardRepository.find(boardId, cardId);
    if (!card) throw new CardNotFoundError();
    return card;
  }

  private async findComment(boardId: string, commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(boardId, commentId);
    if (!comment) throw new CommentNotFoundError();
    return comment;
  }
}
