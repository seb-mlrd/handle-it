import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { groupFieldErrors } from './group-field-errors.js';

describe('groupFieldErrors', () => {
  it('rassemble tous les messages de chaque champ', () => {
    const schema = z.object({ name: z.string().min(2, 'court').regex(/^a/, 'a requis') });
    const { error } = schema.safeParse({ name: 'b' });
    expect(error && groupFieldErrors(error)).toEqual({ name: ['court', 'a requis'] });
  });
});
