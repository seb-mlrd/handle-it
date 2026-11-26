interface HeaderResponse {
  set(headers: Readonly<Record<string, string>>): unknown;
}

/** En-têtes sûrs pour une API JSON : ni affichage dans une page tierce, ni mise en cache. */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // Les réponses contiennent des données privées : ni le navigateur ni un proxy ne les gardent.
  'Cache-Control': 'no-store',
};

export function applySecurityHeaders(
  _request: unknown,
  response: HeaderResponse,
  next: () => void,
): void {
  response.set(SECURITY_HEADERS);
  next();
}
