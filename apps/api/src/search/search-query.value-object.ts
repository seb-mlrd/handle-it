import { InvalidSearchQueryError } from './errors/invalid-search-query.error.js';

const WORD_PATTERN = /[\p{L}\p{N}]+/gu;
const WORD_MIN_LENGTH = 2;
const MAX_WORDS = 10;

/** Mots cherchés ; seule la forme `mot:* & mot:*` atteint PostgreSQL, jamais le texte saisi. */
export class SearchQuery {
  private constructor(private readonly words: readonly string[]) {}

  /** Lève `InvalidSearchQueryError` si le texte ne contient aucun mot de deux lettres ou plus. */
  static fromText(text: string): SearchQuery {
    const words = (text.match(WORD_PATTERN) ?? [])
      .map((word) => word.toLocaleLowerCase('fr-FR'))
      .filter((word) => word.length >= WORD_MIN_LENGTH);
    const uniqueWords = [...new Set(words)].slice(0, MAX_WORDS);
    if (uniqueWords.length === 0) throw new InvalidSearchQueryError();
    return new SearchQuery(uniqueWords);
  }

  getWords(): readonly string[] {
    return this.words;
  }

  /** Chaque mot peut être un début de mot : « pai » trouve « pain » pendant la frappe. */
  toTextSearchQuery(): string {
    return this.words.map((word) => `${word}:*`).join(' & ');
  }
}
