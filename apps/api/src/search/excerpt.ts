import type { ExcerptSegment } from '@handle-it/contracts';

/** Marques posées par `ts_headline` autour d'un mot trouvé. */
export const MATCH_START = '\u0002';
export const MATCH_END = '\u0003';

/**
 * `ts_headline` supprime ce qui ressemble à une balise ou une entité HTML : ces caractères passent
 * par des remplaçants (zone à usage privé d'Unicode), puis sont rétablis ici.
 */
const PROTECTED_CHARACTERS = '<>&';
const STAND_INS = '\uE000\uE001\uE002';

/**
 * Arguments de `translate()` pour préparer le texte : les caractères protégés prennent leur
 * remplaçant ; les marques et les remplaçants déjà présents dans le texte sont retirés.
 */
export const HEADLINE_TRANSLATION = {
  from: `${PROTECTED_CHARACTERS}${STAND_INS}${MATCH_START}${MATCH_END}`,
  to: STAND_INS,
} as const;

function restoreProtectedCharacters(text: string): string {
  return [...text]
    .map((character) => {
      const index = STAND_INS.indexOf(character);
      return index === -1 ? character : PROTECTED_CHARACTERS.charAt(index);
    })
    .join('');
}

/** Extrait découpé en morceaux : le client met en évidence, le serveur n'envoie jamais de HTML. */
export class Excerpt {
  private constructor(private readonly segments: readonly ExcerptSegment[]) {}

  static fromHighlighted(highlighted: string): Excerpt {
    const [before = '', ...parts] = restoreProtectedCharacters(highlighted).split(MATCH_START);
    const segments: ExcerptSegment[] = [{ text: before, isMatch: false }];
    for (const part of parts) {
      const [match = '', ...rest] = part.split(MATCH_END);
      segments.push({ text: match, isMatch: true }, { text: rest.join(''), isMatch: false });
    }
    return new Excerpt(Excerpt.merge(segments));
  }

  getSegments(): readonly ExcerptSegment[] {
    return this.segments;
  }

  /** Deux mots trouvés côte à côte forment une seule mise en évidence. */
  private static merge(segments: readonly ExcerptSegment[]): ExcerptSegment[] {
    const merged: ExcerptSegment[] = [];
    for (const segment of segments) {
      if (segment.text === '') continue;
      const last = merged.at(-1);
      if (last?.isMatch === segment.isMatch) {
        merged[merged.length - 1] = { ...last, text: last.text + segment.text };
      } else {
        merged.push(segment);
      }
    }
    return merged;
  }
}
