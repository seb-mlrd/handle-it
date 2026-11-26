import type { BoardEventEnvelope } from '@handle-it/contracts';

/** Diffusion en direct. Un échec ne doit jamais faire échouer une modification déjà enregistrée. */
export abstract class BoardEventPublisher {
  /** Prévient les membres présents sur le board. */
  abstract publish(envelope: BoardEventEnvelope): void;
  /** Coupe aussitôt l'accès en direct d'un utilisateur à un board. */
  abstract evict(boardId: string, userId: string): void;
}
