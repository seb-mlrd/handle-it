import { z } from 'zod';

const CURSOR_MAX_LENGTH = 200;

/** Curseur opaque renvoyé par l'API pour lire la page suivante. */
export const cursorSchema = z.string().min(1).max(CURSOR_MAX_LENGTH);
