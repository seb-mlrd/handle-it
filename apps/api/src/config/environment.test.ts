import { describe, expect, it } from 'vitest';
import { Environment } from './environment.js';

const DATABASE_URL = 'postgresql://user:motdepasse@localhost:5433/base';

describe('Environment', () => {
  it('lit les variables valides', () => {
    const environment = Environment.fromVariables({ DATABASE_URL, PORT: '4000' });
    expect(environment.getDatabaseUrl()).toBe(DATABASE_URL);
    expect(environment.getPort()).toBe(4000);
  });

  it('utilise le port par défaut', () => {
    expect(Environment.fromVariables({ DATABASE_URL }).getPort()).toBe(3001);
  });

  it('refuse une URL de base absente', () => {
    expect(() => Environment.fromVariables({})).toThrow('DATABASE_URL');
  });

  it("n'expose pas la valeur refusée", () => {
    const read = () => Environment.fromVariables({ DATABASE_URL: 'mysql://secret@hote/base' });
    expect(read).toThrow(/^Variables d'environnement invalides : DATABASE_URL$/);
  });
});
