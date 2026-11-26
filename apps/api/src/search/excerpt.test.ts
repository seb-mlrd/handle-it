import { describe, expect, it } from 'vitest';
import { Excerpt, MATCH_END, MATCH_START } from './excerpt.js';

const mark = (text: string) => `${MATCH_START}${text}${MATCH_END}`;

describe('Excerpt', () => {
  it('sépare les mots trouvés du reste', () => {
    const excerpt = Excerpt.fromHighlighted(`Acheter des ${mark('pâtes')} et du ${mark('pain')}`);
    expect(excerpt.getSegments()).toEqual([
      { text: 'Acheter des ', isMatch: false },
      { text: 'pâtes', isMatch: true },
      { text: ' et du ', isMatch: false },
      { text: 'pain', isMatch: true },
    ]);
  });

  it('garde un texte sans mot trouvé, et réunit deux mots trouvés voisins', () => {
    expect(Excerpt.fromHighlighted('Rien ici').getSegments()).toEqual([
      { text: 'Rien ici', isMatch: false },
    ]);
    expect(Excerpt.fromHighlighted(`${mark('pain')}${mark('complet')}`).getSegments()).toEqual([
      { text: 'paincomplet', isMatch: true },
    ]);
  });

  it('rétablit les caractères protégés, sans jamais produire de HTML', () => {
    const protectedText = `\uE000b\uE001${mark('x')} \uE002 y`;
    expect(Excerpt.fromHighlighted(protectedText).getSegments()).toEqual([
      { text: '<b>', isMatch: false },
      { text: 'x', isMatch: true },
      { text: ' & y', isMatch: false },
    ]);
  });
});
