import { describe, expect, it } from 'vitest';
import { searchRequestSchema } from './search.dto.js';

const LABEL = '749ccf64-e16f-4760-9298-12be9b41f390';

describe('searchRequestSchema', () => {
  it('accepte une recherche simple, nettoyée de ses espaces', () => {
    expect(searchRequestSchema.parse({ q: '  pain ' })).toEqual({ q: 'pain' });
  });

  it('lit les labels séparés par des virgules', () => {
    const request = searchRequestSchema.parse({ q: 'pain', labelIds: `${LABEL},` });
    expect(request.labelIds).toEqual([LABEL]);
  });

  it.each([
    { q: 'a' },
    { q: 'a'.repeat(101) },
    { q: 'pain', due: 'overdue' },
    { q: 'pain', due: 'demain', today: '2026-11-26' },
    { q: 'pain', labelIds: 'pas-un-uuid' },
  ])('refuse %o', (request) => {
    expect(searchRequestSchema.safeParse(request).success).toBe(false);
  });
});
