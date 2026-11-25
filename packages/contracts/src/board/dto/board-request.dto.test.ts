import { describe, expect, it } from 'vitest';
import { boardRequestSchema } from './board-request.dto.js';

describe('boardRequestSchema', () => {
  it('retire les espaces autour du nom', () => {
    expect(boardRequestSchema.parse({ name: ' Maison ' })).toEqual({ name: 'Maison' });
  });

  it.each(['', '   ', 'a'.repeat(81), null])('refuse %s', (name) => {
    expect(boardRequestSchema.safeParse({ name }).success).toBe(false);
  });
});
