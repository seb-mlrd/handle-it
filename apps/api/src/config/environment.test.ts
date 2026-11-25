import { describe, expect, it } from 'vitest';
import { Environment } from './environment.js';

const DATABASE_URL = 'postgresql://user:motdepasse@localhost:5433/base';
const VALID = { DATABASE_URL, WEB_ORIGIN: 'http://localhost:5173' };

describe('Environment', () => {
  it('lit les variables valides', () => {
    const environment = Environment.fromVariables({ ...VALID, PORT: '4000' });
    expect(environment.getDatabaseUrl()).toBe(DATABASE_URL);
    expect(environment.getPort()).toBe(4000);
  });

  it('utilise le port par défaut', () => {
    expect(Environment.fromVariables(VALID).getPort()).toBe(3001);
  });

  it('refuse une URL de base absente', () => {
    expect(() => Environment.fromVariables({})).toThrow('DATABASE_URL');
  });

  it("n'expose pas la valeur refusée", () => {
    const read = () =>
      Environment.fromVariables({ ...VALID, DATABASE_URL: 'mysql://secret@hote/base' });
    expect(read).toThrow(/^Variables d'environnement invalides : DATABASE_URL$/);
  });

  it.each([
    ['http://localhost:5173', false],
    ['https://app.example.com', true],
  ])("accepte l'origine %s, sécurisée : %s", (origin, isSecure) => {
    const environment = Environment.fromVariables({ ...VALID, WEB_ORIGIN: origin });
    expect(environment.isWebOriginSecure()).toBe(isSecure);
  });

  it.each(['http://app.example.com', 'https://app.example.com/', 'app', undefined])(
    "refuse l'origine %s",
    (origin) => {
      const read = () => Environment.fromVariables({ ...VALID, WEB_ORIGIN: origin });
      expect(read).toThrow('WEB_ORIGIN');
    },
  );
});
