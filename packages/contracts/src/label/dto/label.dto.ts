import { z } from 'zod';

const LABEL_NAME_MAX_LENGTH = 30;
const NAME_REQUIRED = 'Le nom du label est obligatoire';

/** Huit couleurs fixes, contrastées en clair et en sombre ; jamais de violet. */
export const labelColorSchema = z.enum(
  ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'pink'],
  'Choisis une couleur',
);

export type LabelColor = z.infer<typeof labelColorSchema>;

export const labelRequestSchema = z.object({
  name: z
    .string(NAME_REQUIRED)
    .trim()
    .min(1, NAME_REQUIRED)
    .max(LABEL_NAME_MAX_LENGTH, `Le nom du label est limité à ${LABEL_NAME_MAX_LENGTH} caractères`),
  color: labelColorSchema,
});

export type LabelRequest = z.infer<typeof labelRequestSchema>;

export const labelResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: labelColorSchema,
});

export type LabelResponse = z.infer<typeof labelResponseSchema>;

export const labelListResponseSchema = z.array(labelResponseSchema);
