const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = DIGITS.length;
const INTEGER_LENGTH = 6;
const INTEGER_COUNT = BASE ** INTEGER_LENGTH;
const RANK_PATTERN = new RegExp(`^[0-9A-Za-z]{${INTEGER_LENGTH}}([0-9A-Za-z]*[1-9A-Za-z])?$`);

/**
 * Position textuelle d'un élément, comparable octet par octet.
 * Partie entière de taille fixe pour les ajouts en bout de liste, puis fraction pour les insertions :
 * placer un élément ne modifie jamais les autres.
 */
export class Rank {
  private constructor(private readonly value: string) {}

  static fromValue(value: string): Rank {
    if (!RANK_PATTERN.test(value)) {
      throw new RangeError('Rang invalide');
    }
    return new Rank(value);
  }

  /** Calcule un rang strictement entre deux voisins ; `null` désigne un bout de la liste. */
  static between(previous: Rank | null, next: Rank | null): Rank {
    if (previous && next) return Rank.inside(previous, next);
    if (previous) return Rank.fromInteger(previous.getInteger() + 1);
    if (next) return Rank.fromInteger(next.getInteger() - 1);
    return Rank.fromInteger(Math.floor(INTEGER_COUNT / 2));
  }

  getValue(): string {
    return this.value;
  }

  private static inside(previous: Rank, next: Rank): Rank {
    if (previous.value >= next.value) {
      throw new RangeError('Les rangs voisins ne sont pas dans l’ordre');
    }
    const integer = previous.getInteger();
    const distance = next.getInteger() - integer;
    if (distance > 1) {
      return Rank.fromInteger(integer + Math.floor(distance / 2));
    }
    const upperFraction = distance === 0 ? next.getFraction() : null;
    const fraction = Rank.findMiddle(previous.getFraction(), upperFraction);
    return new Rank(Rank.encode(integer) + fraction);
  }

  /** Fraction strictement comprise entre deux autres ; `null` vaut 1. */
  private static findMiddle(lower: string, upper: string | null): string {
    const lowerDigit = DIGITS.indexOf(lower[0] ?? '0');
    const upperDigit = upper === null ? BASE : DIGITS.indexOf(upper[0] ?? '0');
    if (upperDigit - lowerDigit > 1) {
      return DIGITS.charAt(Math.floor((lowerDigit + upperDigit) / 2));
    }
    if (upper !== null && upperDigit === lowerDigit) {
      return DIGITS.charAt(lowerDigit) + Rank.findMiddle(lower.slice(1), upper.slice(1));
    }
    if (upper !== null && upper.length > 1) {
      return DIGITS.charAt(upperDigit);
    }
    return DIGITS.charAt(lowerDigit) + Rank.findMiddle(lower.slice(1), null);
  }

  private static fromInteger(integer: number): Rank {
    if (integer < 0 || integer >= INTEGER_COUNT) {
      throw new RangeError('Plus aucun rang disponible de ce côté');
    }
    return new Rank(Rank.encode(integer));
  }

  private static encode(integer: number): string {
    let remaining = integer;
    let encoded = '';
    for (let position = 0; position < INTEGER_LENGTH; position += 1) {
      encoded = DIGITS.charAt(remaining % BASE) + encoded;
      remaining = Math.floor(remaining / BASE);
    }
    return encoded;
  }

  private getInteger(): number {
    return [...this.value.slice(0, INTEGER_LENGTH)].reduce(
      (integer, digit) => integer * BASE + DIGITS.indexOf(digit),
      0,
    );
  }

  private getFraction(): string {
    return this.value.slice(INTEGER_LENGTH);
  }
}
