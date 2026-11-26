import { type DueFilter, dueFilterSchema } from '@handle-it/contracts';

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: 'En retard',
  'this-week': 'Cette semaine',
  none: 'Sans échéance',
};

/** Valeur d'un menu ou d'une adresse : tout ce qui n'est pas un filtre connu n'en est pas un. */
export function readDueFilter(value: string | null): DueFilter | null {
  const result = dueFilterSchema.safeParse(value);
  return result.success ? result.data : null;
}
