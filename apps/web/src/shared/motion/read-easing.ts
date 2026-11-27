/**
 * Lit une courbe définie dans index.css. Les animations lancées en JavaScript ne résolvent pas
 * `var()` : la valeur est relue ici pour que la courbe reste définie à un seul endroit.
 */
export function readEasing(variableName: string, fallback = 'ease-out'): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
}
