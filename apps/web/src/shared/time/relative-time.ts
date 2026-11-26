const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** « à l'instant », « il y a 5 minutes », « hier » ; au-delà d'une semaine, la date. */
export function formatRelativeTime(isoDate: string, now: number): string {
  const elapsed = now - new Date(isoDate).getTime();
  if (elapsed < MINUTE) return "à l'instant";
  if (elapsed < HOUR) return RELATIVE_FORMAT.format(-Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return RELATIVE_FORMAT.format(-Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < 7 * DAY) return RELATIVE_FORMAT.format(-Math.floor(elapsed / DAY), 'day');
  return `le ${DATE_FORMAT.format(new Date(isoDate))}`;
}

/** Date complète, pour l'infobulle et les lecteurs d'écran. */
export function formatFullDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}
