import type { BoardEvent, BoardEventEnvelope, BoardViewResponse } from '@handle-it/contracts';
import type { QueryClient } from '@tanstack/react-query';
import {
  BOARDS_KEY,
  getBoardKey,
  getCardKey,
  getCommentsKey,
  getMoveKey,
} from '../boards/board-keys';
import { applyBoardEvent, decideOnVersion } from './board-events';

/** Tient le board en cache à jour à partir des événements reçus. */
export class BoardSynchronizer {
  private latestVersion = 0;
  private readonly boardKey: readonly unknown[];

  constructor(
    private readonly queryClient: QueryClient,
    private readonly boardId: string,
  ) {
    this.boardKey = getBoardKey(boardId);
  }

  receive({ version, event }: BoardEventEnvelope): void {
    this.latestVersion = Math.max(this.latestVersion, version);
    // Toute modification réussie s'inscrit à l'historique, celui du board comme celui des cartes.
    this.refresh('activities');
    this.refreshRelatedData(event);
    const board = this.getBoard();
    // Une lecture ou un déplacement en cours remplacera le board : `catchUp` complétera ensuite.
    if (!board || this.isBusy()) return;
    if (decideOnVersion(board.version, version) === 'apply') {
      this.queryClient.setQueryData(this.boardKey, applyBoardEvent(board, version, event));
    }
    this.catchUp();
  }

  noteVersion(version: number): void {
    this.latestVersion = Math.max(this.latestVersion, version);
    this.catchUp();
  }

  /** Relit le board s'il est en retard sur la dernière version annoncée. */
  catchUp(): void {
    const board = this.getBoard();
    const isBehind = board !== undefined && board.version < this.latestVersion;
    // Après un échec, insister ne ferait que boucler : la reconnexion relira le board.
    const hasFailed = this.queryClient.getQueryState(this.boardKey)?.status === 'error';
    if (isBehind && !hasFailed && !this.isBusy()) this.reload();
  }

  reload(): void {
    void this.queryClient.invalidateQueries({ queryKey: this.boardKey, exact: true });
  }

  /** Relit aussi les membres et la carte ouverte, après une coupure. */
  reloadEverything(): void {
    void this.queryClient.invalidateQueries({ queryKey: this.boardKey });
  }

  private refreshRelatedData(event: BoardEvent): void {
    switch (event.type) {
      case 'board-renamed':
        void this.queryClient.invalidateQueries({ queryKey: BOARDS_KEY, exact: true });
        break;
      case 'board-deleted':
        this.reload();
        break;
      case 'members-changed':
        this.refresh('members');
        this.refresh('invitations');
        break;
      case 'card-updated':
        this.refreshCard(event.card.id);
        break;
      case 'card-deleted':
        this.refreshCard(event.cardId);
        break;
      case 'column-deleted':
        this.refresh('cards');
        break;
      case 'card-comments-changed':
        // Le brouillon en cours vit hors du cache : relire le fil ne l'efface pas.
        void this.queryClient.invalidateQueries({
          queryKey: getCommentsKey(this.boardId, event.cardId),
        });
        break;
    }
  }

  private refreshCard(cardId: string): void {
    const cardKey = getCardKey(this.boardId, cardId);
    // Sa propre modification est déjà en route ; relire une carte qu'on supprime échouerait.
    if (this.queryClient.isMutating({ mutationKey: cardKey }) > 0) return;
    void this.queryClient.invalidateQueries({ queryKey: cardKey });
  }

  private refresh(part: string): void {
    void this.queryClient.invalidateQueries({ queryKey: [...this.boardKey, part] });
  }

  private getBoard(): BoardViewResponse | undefined {
    return this.queryClient.getQueryData<BoardViewResponse>(this.boardKey);
  }

  private isBusy(): boolean {
    const isFetching = this.queryClient.isFetching({ queryKey: this.boardKey, exact: true }) > 0;
    const isMoving = this.queryClient.isMutating({ mutationKey: getMoveKey(this.boardId) }) > 0;
    return isFetching || isMoving;
  }
}
