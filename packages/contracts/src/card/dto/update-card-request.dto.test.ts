import { describe, expect, it } from 'vitest';
import { updateCardRequestSchema } from './update-card-request.dto.js';

const REQUEST = { title: 'Acheter du pain', description: '' };

describe('updateCardRequestSchema', () => {
  it('accepte une description vide et garde ses retours à la ligne', () => {
    expect(updateCardRequestSchema.parse(REQUEST)).toEqual(REQUEST);
    const request = { title: ' Pain ', description: 'un\ndeux\n' };
    expect(updateCardRequestSchema.parse(request)).toEqual({
      title: 'Pain',
      description: 'un\ndeux',
    });
  });

  it.each([
    ['title', ' '],
    ['title', 'a'.repeat(201)],
    ['description', 'a'.repeat(5001)],
    ['description', undefined],
  ])('refuse %s invalide', (field, value) => {
    const result = updateCardRequestSchema.safeParse({ ...REQUEST, [field]: value });
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });
});
