import { InvalidDueDateError } from './errors/invalid-due-date.error.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Jour du calendrier, sans heure ni fuseau. */
export class DueDate {
  private constructor(private readonly value: string) {}

  /** Lève `InvalidDueDateError` pour une date qui n'existe pas (2026-02-30). */
  static fromValue(value: string): DueDate {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime())) throw new InvalidDueDateError();
    if (date.toISOString().slice(0, 10) !== value) throw new InvalidDueDateError();
    return new DueDate(value);
  }

  /** PostgreSQL rend un type DATE comme minuit UTC ce jour-là. */
  static fromDatabase(date: Date): DueDate {
    return new DueDate(date.toISOString().slice(0, 10));
  }

  getValue(): string {
    return this.value;
  }

  toDatabase(): Date {
    return new Date(`${this.value}T00:00:00.000Z`);
  }
}
