import { z } from 'zod';

const nameSchema = z.string();

/** Ce qui s'est passé, avec les noms tels qu'ils étaient au moment de l'action. */
export const activityDetailsSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('board-renamed'), boardName: nameSchema }),
  z.object({ type: z.literal('column-created'), columnName: nameSchema }),
  z.object({ type: z.literal('column-renamed'), columnName: nameSchema }),
  z.object({ type: z.literal('column-moved'), columnName: nameSchema }),
  z.object({ type: z.literal('column-deleted'), columnName: nameSchema }),
  z.object({ type: z.literal('card-created'), cardTitle: nameSchema, columnName: nameSchema }),
  z.object({ type: z.literal('card-updated'), cardTitle: nameSchema }),
  z.object({ type: z.literal('card-moved'), cardTitle: nameSchema, columnName: nameSchema }),
  z.object({ type: z.literal('card-deleted'), cardTitle: nameSchema }),
  z.object({ type: z.literal('label-created'), labelName: nameSchema }),
  z.object({ type: z.literal('label-updated'), labelName: nameSchema }),
  z.object({ type: z.literal('label-deleted'), labelName: nameSchema }),
  z.object({ type: z.literal('card-label-added'), cardTitle: nameSchema, labelName: nameSchema }),
  z.object({ type: z.literal('card-label-removed'), cardTitle: nameSchema, labelName: nameSchema }),
  z.object({ type: z.literal('card-due-set'), cardTitle: nameSchema, dueOn: z.iso.date() }),
  z.object({ type: z.literal('card-due-removed'), cardTitle: nameSchema }),
  z.object({ type: z.literal('member-joined') }),
  z.object({ type: z.literal('member-left') }),
  z.object({ type: z.literal('member-removed'), memberName: nameSchema }),
]);

export type ActivityDetails = z.infer<typeof activityDetailsSchema>;

export const activityResponseSchema = z.object({
  id: z.uuid(),
  /** `null` quand le compte de l'auteur a été supprimé. */
  actorName: z.string().nullable(),
  cardId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  details: activityDetailsSchema,
});

export type ActivityResponse = z.infer<typeof activityResponseSchema>;

/** Une page d'historique, de la plus récente à la plus ancienne. */
export const activityPageResponseSchema = z.object({
  items: z.array(activityResponseSchema),
  nextCursor: z.string().nullable(),
});

export type ActivityPageResponse = z.infer<typeof activityPageResponseSchema>;

const CURSOR_MAX_LENGTH = 200;

export const activityPageRequestSchema = z.object({
  before: z.string().min(1).max(CURSOR_MAX_LENGTH).optional(),
});

export type ActivityPageRequest = z.infer<typeof activityPageRequestSchema>;
