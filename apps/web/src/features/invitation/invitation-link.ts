export const INVITATION_PATH = '/invitation';

const TOKEN_PARAMETER = 'token';

/** Le jeton suit un « # » : le navigateur ne l'envoie jamais au serveur ni aux autres sites. */
export function createInvitationLink(origin: string, token: string): string {
  return `${origin}${INVITATION_PATH}#${new URLSearchParams({ [TOKEN_PARAMETER]: token })}`;
}

export function readInvitationToken(hash: string): string {
  return new URLSearchParams(hash.replace(/^#/, '')).get(TOKEN_PARAMETER) ?? '';
}
