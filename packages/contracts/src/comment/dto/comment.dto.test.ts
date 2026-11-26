import { describe, expect, it } from 'vitest';
import { COMMENT_MAX_LENGTH, commentRequestSchema } from './comment.dto.js';

describe('commentRequestSchema', () => {
  it('retire les espaces autour et garde les retours à la ligne', () => {
    expect(commentRequestSchema.parse({ body: '  un\ndeux \n' })).toEqual({ body: 'un\ndeux' });
  });

  it.each([' \n ', 'a'.repeat(COMMENT_MAX_LENGTH + 1), undefined])('refuse « %s »', (body) => {
    expect(commentRequestSchema.safeParse({ body }).success).toBe(false);
  });

  it('accepte la longueur maximale', () => {
    const body = 'a'.repeat(COMMENT_MAX_LENGTH);
    expect(commentRequestSchema.parse({ body })).toEqual({ body });
  });
});
