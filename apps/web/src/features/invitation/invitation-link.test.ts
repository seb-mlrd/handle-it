import { describe, expect, it } from 'vitest';
import { createInvitationLink, readInvitationToken } from './invitation-link';

describe('lien d’invitation', () => {
  it('garde le jeton hors de la partie envoyée au serveur', () => {
    const url = new URL(createInvitationLink('https://app.example.com', 'a-b_c'));
    expect(url.pathname + url.search).toBe('/invitation');
    expect(readInvitationToken(url.hash)).toBe('a-b_c');
  });

  it.each(['', '#', '#autre=1'])('renvoie un jeton vide pour « %s »', (hash) => {
    expect(readInvitationToken(hash)).toBe('');
  });
});
