const MINUTE_MILLISECONDS = 60_000;
const HOUR_MILLISECONDS = 60 * MINUTE_MILLISECONDS;
const DAY_MILLISECONDS = 24 * HOUR_MILLISECONDS;

const UNITS = [
  { unit: 'day', milliseconds: DAY_MILLISECONDS },
  { unit: 'hour', milliseconds: HOUR_MILLISECONDS },
  { unit: 'minute', milliseconds: MINUTE_MILLISECONDS },
] as const;

/** Temps restant arrondi à l'unité la plus proche ; `null` une fois écoulé. */
export function formatRemainingTime(expiresAt: string, now: number): string | null {
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return null;
  const { unit, milliseconds } = UNITS.find((entry) => remaining >= entry.milliseconds) ?? {
    unit: 'minute',
    milliseconds: MINUTE_MILLISECONDS,
  };
  // Un arrondi supérieur annoncerait « 2 heures » pour un lien d'une heure au moindre décalage.
  const value = Math.max(1, Math.round(remaining / milliseconds));
  return new Intl.NumberFormat('fr-FR', { style: 'unit', unit, unitDisplay: 'long' }).format(value);
}
