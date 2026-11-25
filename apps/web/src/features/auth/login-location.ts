import type { Location } from 'react-router';

const HOME_PATH = '/';

/** État de navigation qui retient la page demandée avant la connexion. */
export interface LoginLocationState {
  readonly from: string;
}

export function createLoginState(location: Location): LoginLocationState {
  return { from: `${location.pathname}${location.search}${location.hash}` };
}

/** Page à afficher après la connexion. */
export function readReturnPath(state: unknown): string {
  const isLoginState = typeof state === 'object' && state !== null && 'from' in state;
  return isLoginState && typeof state.from === 'string' ? state.from : HOME_PATH;
}
