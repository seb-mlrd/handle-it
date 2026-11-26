import { z } from 'zod';

/** Date sans heure (AAAA-MM-JJ) : la même pour tous, quel que soit le fuseau. */
export const dueDateSchema = z.iso.date('Écris une date au format AAAA-MM-JJ');

export const setDueDateRequestSchema = z.object({
  /** `null` retire l'échéance. */
  dueOn: dueDateSchema.nullable(),
});

export type SetDueDateRequest = z.infer<typeof setDueDateRequestSchema>;
