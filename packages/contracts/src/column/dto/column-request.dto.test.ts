import { describe, expect, it } from 'vitest';
import { columnRequestSchema } from './column-request.dto.js';

describe('columnRequestSchema', () => {
  it('retire les espaces autour du nom', () => {
    expect(columnRequestSchema.parse({ name: ' À faire ' })).toEqual({ name: 'À faire' });
  });

  it.each(['', '   ', 'a'.repeat(51), null])('refuse %s', (name) => {
    expect(columnRequestSchema.safeParse({ name }).success).toBe(false);
  });
});
