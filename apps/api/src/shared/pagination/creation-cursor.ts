import { InvalidCursorError } from './invalid-cursor.error.js';

const SEPARATOR = '_';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Position dans une liste triée par date de création, puis par identifiant pour départager deux
 * éléments de même date.
 */
export class CreationCursor {
  private constructor(
    private readonly createdAt: Date,
    private readonly id: string,
  ) {}

  static after(createdAt: Date, id: string): CreationCursor {
    return new CreationCursor(createdAt, id);
  }

  /** Lève `InvalidCursorError` pour un curseur qui ne vient pas de l'API. */
  static decode(value: string): CreationCursor {
    const [date, id] = Buffer.from(value, 'base64url').toString('utf8').split(SEPARATOR);
    const createdAt = new Date(date ?? '');
    if (Number.isNaN(createdAt.getTime()) || !id || !UUID_PATTERN.test(id)) {
      throw new InvalidCursorError();
    }
    return new CreationCursor(createdAt, id);
  }

  encode(): string {
    return Buffer.from(`${this.createdAt.toISOString()}${SEPARATOR}${this.id}`).toString(
      'base64url',
    );
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getId(): string {
    return this.id;
  }
}
