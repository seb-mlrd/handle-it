import { InvalidActivityCursorError } from './errors/invalid-activity-cursor.error.js';

const SEPARATOR = '_';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Position dans l'historique : date puis identifiant, pour départager deux entrées de même date. */
export class ActivityCursor {
  private constructor(
    private readonly createdAt: Date,
    private readonly id: string,
  ) {}

  static after(createdAt: Date, id: string): ActivityCursor {
    return new ActivityCursor(createdAt, id);
  }

  /** Lève `InvalidActivityCursorError` pour un curseur qui ne vient pas de l'API. */
  static decode(value: string): ActivityCursor {
    const [date, id] = Buffer.from(value, 'base64url').toString('utf8').split(SEPARATOR);
    const createdAt = new Date(date ?? '');
    if (Number.isNaN(createdAt.getTime()) || !id || !UUID_PATTERN.test(id)) {
      throw new InvalidActivityCursorError();
    }
    return new ActivityCursor(createdAt, id);
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
