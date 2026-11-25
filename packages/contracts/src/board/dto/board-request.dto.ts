import { z } from 'zod';
import { boardNameSchema } from '../board-name-schema.js';

/** Création ou renommage d'un board : seul son nom est modifiable. */
export const boardRequestSchema = z.object({ name: boardNameSchema });

export type BoardRequest = z.infer<typeof boardRequestSchema>;
