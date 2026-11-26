import { describe, expect, it } from 'vitest';
import { Comment } from './comment.entity.js';

const WRITTEN_AT = new Date('2026-11-26T10:00:00Z');

describe('Comment', () => {
  it('reconnaît son auteur, mais pas après la suppression de son compte', () => {
    const comment = Comment.write('c', 'card', 'ada', 'Bonjour', WRITTEN_AT);
    expect(comment.isWrittenBy('ada')).toBe(true);
    expect(comment.isWrittenBy('bob')).toBe(false);
    const orphan = new Comment('c', 'card', null, null, 'Bonjour', WRITTEN_AT);
    expect(orphan.isWrittenBy('ada')).toBe(false);
  });

  it('garde sa date de création et note celle de la modification', () => {
    const editedAt = new Date('2026-11-26T11:00:00Z');
    const comment = Comment.write('c', 'card', 'ada', 'Bonjour', WRITTEN_AT);
    expect(comment.getUpdatedAt()).toBeNull();
    const edited = comment.edit('Bonsoir', editedAt);
    expect(edited.getBody()).toBe('Bonsoir');
    expect(edited.getCreatedAt()).toBe(WRITTEN_AT);
    expect(edited.getUpdatedAt()).toBe(editedAt);
    expect(comment.getBody()).toBe('Bonjour');
  });
});
