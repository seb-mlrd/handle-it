import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

/** Valide un identifiant d'URL avant qu'il n'atteigne la base. */
export const uuidPipe = new ZodValidationPipe(z.uuid());
