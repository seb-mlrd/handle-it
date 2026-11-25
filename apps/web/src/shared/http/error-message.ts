import { ApiError, type ApiErrorCode } from './api-error';

const DEFAULT_MESSAGE = 'Une erreur est survenue. Réessaie dans un instant.';

const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  INVALID_REQUEST: 'Certaines informations sont invalides.',
  INVALID_CREDENTIALS: 'E-mail ou mot de passe incorrect.',
  EMAIL_ALREADY_USED: 'Cette adresse e-mail est déjà utilisée.',
  FORBIDDEN: "Tu n'as pas le droit de faire cette action.",
  NOT_FOUND: "Cet élément n'existe plus.",
  UNAUTHENTICATED: 'Ta session a expiré. Reconnecte-toi.',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessaie dans quelques minutes.',
  UNREACHABLE: 'Le serveur ne répond pas. Vérifie ta connexion puis réessaie.',
};

/** Traduit une erreur technique en message pour l'utilisateur. */
export function getErrorMessage(error: unknown): string {
  return (error instanceof ApiError && MESSAGES[error.getCode()]) || DEFAULT_MESSAGE;
}
