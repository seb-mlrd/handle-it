import { z } from 'zod';
import { cardTitleSchema } from '../card-title-schema.js';

export const createCardRequestSchema = z.object({ title: cardTitleSchema });

export type CreateCardRequest = z.infer<typeof createCardRequestSchema>;
