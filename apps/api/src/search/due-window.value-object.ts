import type { DueFilter } from '@handle-it/contracts';
import { DueDate } from '../card/due-date.value-object.js';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

/** Échéances retenues par un filtre, vues depuis le jour du visiteur. */
export class DueWindow {
  private constructor(
    private readonly isMissing: boolean,
    private readonly onOrAfter: DueDate | null,
    private readonly before: DueDate | null,
  ) {}

  /** `this-week` va d'aujourd'hui à dimanche inclus ; une carte en retard n'y figure pas. */
  static from(filter: DueFilter, today: DueDate): DueWindow {
    switch (filter) {
      case 'overdue':
        return new DueWindow(false, null, today);
      case 'this-week':
        return new DueWindow(false, today, DueWindow.nextMonday(today));
      case 'none':
        return new DueWindow(true, null, null);
    }
  }

  /** Vrai pour les cartes sans échéance. */
  isWithoutDate(): boolean {
    return this.isMissing;
  }

  /** Première date retenue, incluse. */
  getOnOrAfter(): DueDate | null {
    return this.onOrAfter;
  }

  /** Première date exclue. */
  getBefore(): DueDate | null {
    return this.before;
  }

  private static nextMonday(today: DueDate): DueDate {
    const date = today.toDatabase();
    // getUTCDay compte dimanche 0 : on passe à lundi 1 … dimanche 7.
    const isoWeekday = date.getUTCDay() || DAYS_PER_WEEK;
    const daysToMonday = DAYS_PER_WEEK + 1 - isoWeekday;
    return DueDate.fromDatabase(new Date(date.getTime() + daysToMonday * DAY_MILLISECONDS));
  }
}
