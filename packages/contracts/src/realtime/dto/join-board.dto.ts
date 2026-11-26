import { z } from 'zod';

export const joinBoardRequestSchema = z.object({ boardId: z.uuid() });

export type JoinBoardRequest = z.infer<typeof joinBoardRequestSchema>;

export const joinBoardResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('joined'), version: z.int() }),
  z.object({ status: z.literal('refused') }),
]);

export type JoinBoardResponse = z.infer<typeof joinBoardResponseSchema>;

export const boardAccessLostSchema = z.object({ boardId: z.uuid() });

export type BoardAccessLost = z.infer<typeof boardAccessLostSchema>;
