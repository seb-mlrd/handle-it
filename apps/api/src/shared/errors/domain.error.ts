import type { ErrorCode } from '@handle-it/contracts';

export type DomainErrorKind =
  'invalid' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict';

/** Erreur métier attendue, indépendante du protocole qui la transporte. */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  abstract readonly code: ErrorCode;
}
