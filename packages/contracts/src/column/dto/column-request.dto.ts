import { z } from 'zod';

const COLUMN_NAME_MAX_LENGTH = 50;
const REQUIRED_MESSAGE = 'Le nom de la colonne est obligatoire';

/** Création ou renommage d'une colonne. */
export const columnRequestSchema = z.object({
  name: z
    .string(REQUIRED_MESSAGE)
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .max(
      COLUMN_NAME_MAX_LENGTH,
      `Le nom de la colonne est limité à ${COLUMN_NAME_MAX_LENGTH} caractères`,
    ),
});

export type ColumnRequest = z.infer<typeof columnRequestSchema>;
