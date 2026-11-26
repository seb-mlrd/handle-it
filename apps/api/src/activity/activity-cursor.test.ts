import { describe, expect, it } from 'vitest';
import { ActivityCursor } from './activity-cursor.js';
import { InvalidActivityCursorError } from './errors/invalid-activity-cursor.error.js';

const ID = '749ccf64-e16f-4760-9298-12be9b41f390';

describe('ActivityCursor', () => {
  it('se relit à l’identique', () => {
    const date = new Date('2026-11-26T10:00:00.123Z');
    const cursor = ActivityCursor.decode(ActivityCursor.after(date, ID).encode());
    expect(cursor.getCreatedAt()).toEqual(date);
    expect(cursor.getId()).toBe(ID);
  });

  it.each([
    '',
    'nimporte',
    Buffer.from(`pas-une-date_${ID}`).toString('base64url'),
    Buffer.from('2026-11-26T10:00:00Z_abc').toString('base64url'),
  ])('refuse « %s »', (value) => {
    expect(() => ActivityCursor.decode(value)).toThrow(InvalidActivityCursorError);
  });
});
