import type { Connect, Plugin } from 'vite';

const LANDING_URLS = new Set(['/decouvrir', '/decouvrir/']);
const LANDING_FILE = '/decouvrir/index.html';

/** Sert la vitrine statique à une adresse propre, sans « index.html » ni barre finale. */
function rewriteLandingUrl(request: Connect.IncomingMessage, _response: unknown, next: () => void) {
  const [path, query] = (request.url ?? '').split('?');
  if (path !== undefined && LANDING_URLS.has(path)) {
    request.url = query === undefined ? LANDING_FILE : `${LANDING_FILE}?${query}`;
  }
  next();
}

export function landingRoute(): Plugin {
  return {
    name: 'handle-it-landing-route',
    configureServer: (server) => void server.middlewares.use(rewriteLandingUrl),
    configurePreviewServer: (server) => void server.middlewares.use(rewriteLandingUrl),
  };
}
