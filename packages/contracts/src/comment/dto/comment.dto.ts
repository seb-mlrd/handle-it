import { z } from 'zod';
import { cursorSchema } from '../../pagination/cursor-schema.js';

export const COMMENT_MAX_LENGTH = 2000;
const BODY_REQUIRED = 'Le commentaire est vide';

/** Texte simple, sans mise en forme ; les retours à la ligne sont gardés. */
export const commentRequestSchema = z.object({
  body: z
    .string(BODY_REQUIRED)
    .trim()
    .min(1, BODY_REQUIRED)
    .max(COMMENT_MAX_LENGTH, `Le commentaire est limité à ${COMMENT_MAX_LENGTH} caractères`),
});

export type CommentRequest = z.infer<typeof commentRequestSchema>;

export const commentResponseSchema = z.object({
  id: z.uuid(),
  /** `null` quand l'auteur n'est plus membre du board : affiché « Ancien membre ». */
  authorName: z.string().nullable(),
  body: z.string(),
  createdAt: z.iso.datetime(),
  /** `null` tant que le commentaire n'a pas été modifié. */
  updatedAt: z.iso.datetime().nullable(),
  /** Droits de la personne qui lit, décidés par l'API. */
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export type CommentResponse = z.infer<typeof commentResponseSchema>;

/** Une page de commentaires, du plus ancien au plus récent. */
export const commentPageResponseSchema = z.object({
  items: z.array(commentResponseSchema),
  nextCursor: z.string().nullable(),
});

export type CommentPageResponse = z.infer<typeof commentPageResponseSchema>;

export const commentPageRequestSchema = z.object({ after: cursorSchema.optional() });

export type CommentPageRequest = z.infer<typeof commentPageRequestSchema>;
