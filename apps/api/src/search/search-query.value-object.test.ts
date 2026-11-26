import { describe, expect, it } from 'vitest';
import { InvalidSearchQueryError } from './errors/invalid-search-query.error.js';
import { SearchQuery } from './search-query.value-object.js';

describe('SearchQuery', () => {
  it('cherche chaque mot comme un début de mot', () => {
    expect(SearchQuery.fromText('Pâtes  fraîches').toTextSearchQuery()).toBe(
      'pâtes:* & fraîches:*',
    );
  });

  it('écarte la syntaxe de recherche, les doublons et les lettres isolées', () => {
    const query = SearchQuery.fromText("l'école & (pain | !pain) 'x");
    expect(query.getWords()).toEqual(['école', 'pain']);
  });

  it('garde les chiffres', () => {
    expect(SearchQuery.fromText('facture 2026').getWords()).toEqual(['facture', '2026']);
  });

  it.each(['!!', ':* &', 'a b c'])('refuse « %s », sans aucun mot', (text) => {
    expect(() => SearchQuery.fromText(text)).toThrow(InvalidSearchQueryError);
  });
});
