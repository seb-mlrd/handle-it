export type DueStatus = 'overdue' | 'today' | 'tomorrow' | 'later';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
// Une date sans heure se lit en UTC : sinon le fuseau du visiteur pourrait la décaler d'un jour.
const LONG_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' });
const SHORT_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const toTime = (date: string) => new Date(`${date}T00:00:00.000Z`).getTime();

/** Où en est une échéance par rapport à aujourd'hui (AAAA-MM-JJ, jour local du visiteur). */
export function getDueStatus(dueOn: string, today: string): DueStatus {
  const days = Math.round((toTime(dueOn) - toTime(today)) / DAY_MILLISECONDS);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  return days === 1 ? 'tomorrow' : 'later';
}

/** Libellé court d'une pastille : un mot l'accompagne toujours, jamais la couleur seule. */
export function describeDueDate(dueOn: string, today: string): string {
  const date = SHORT_FORMAT.format(new Date(toTime(dueOn)));
  switch (getDueStatus(dueOn, today)) {
    case 'overdue':
      return `En retard · ${date}`;
    case 'today':
      return "Aujourd'hui";
    case 'tomorrow':
      return 'Demain';
    case 'later':
      return `Échéance ${date}`;
  }
}

/** « 3 décembre 2026 ». */
export function formatDueDate(dueOn: string): string {
  return LONG_FORMAT.format(new Date(toTime(dueOn)));
}

/** Jour local du visiteur, au format AAAA-MM-JJ. */
export function toLocalDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
