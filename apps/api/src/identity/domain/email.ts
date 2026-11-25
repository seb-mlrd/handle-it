import { InvalidEmailError } from './invalid-email-error.js';

const EMAIL_MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Adresse e-mail normalisée : deux écritures d'une même adresse sont égales. */
export class Email {
  private constructor(private readonly value: string) {}

  static create(rawValue: string): Email {
    const value = rawValue.trim().toLowerCase();
    if (value.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new InvalidEmailError();
    }
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }
}
