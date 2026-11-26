import { z } from 'zod';
import { dueDateSchema } from '../../card/dto/due-date.dto.js';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;

/** `this-week` : d'aujourd'hui à dimanche inclus, sans les cartes en retard. */
export const dueFilterSchema = z.enum(['overdue', 'this-week', 'none']);

export type DueFilter = z.infer<typeof dueFilterSchema>;

/** Les paramètres d'URL arrivent en texte : les labels sont séparés par des virgules. */
const labelIdsSchema = z
  .string()
  .transform((value) => value.split(',').filter(Boolean))
  .pipe(z.array(z.uuid()).max(20));

export const searchRequestSchema = z
  .object({
    q: z
      .string('Écris au moins deux caractères')
      .trim()
      .min(SEARCH_QUERY_MIN_LENGTH, `Écris au moins ${SEARCH_QUERY_MIN_LENGTH} caractères`)
      .max(
        SEARCH_QUERY_MAX_LENGTH,
        `La recherche est limitée à ${SEARCH_QUERY_MAX_LENGTH} caractères`,
      ),
    due: dueFilterSchema.optional(),
    /** Jour du visiteur : « en retard » et « cette semaine » se calculent chez lui. */
    today: dueDateSchema.optional(),
    /** Seulement dans un board : les labels lui sont propres. */
    labelIds: labelIdsSchema.optional(),
  })
  .refine((request) => request.due === undefined || request.today !== undefined, {
    path: ['today'],
    message: 'Le jour du visiteur accompagne le filtre d’échéance',
  });

export type SearchRequest = z.infer<typeof searchRequestSchema>;

/** Morceau d'extrait ; `isMatch` désigne un mot trouvé, mis en évidence par le client. */
export const excerptSegmentSchema = z.object({ text: z.string(), isMatch: z.boolean() });

export type ExcerptSegment = z.infer<typeof excerptSegmentSchema>;

export const searchMatchSchema = z.enum(['title', 'description', 'comment']);

export type SearchMatch = z.infer<typeof searchMatchSchema>;

export const searchResultSchema = z.object({
  cardId: z.uuid(),
  cardTitle: z.string(),
  boardId: z.uuid(),
  boardName: z.string(),
  columnName: z.string(),
  matchedIn: searchMatchSchema,
  excerpt: z.array(excerptSegmentSchema),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({ results: z.array(searchResultSchema) });

export type SearchResponse = z.infer<typeof searchResponseSchema>;
