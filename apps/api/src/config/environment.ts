import { z } from 'zod';

const DEFAULT_PORT = 3001;

const environmentSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
});

/** Configuration validée de l'API, seule source des variables d'environnement. */
export class Environment {
  private constructor(
    private readonly databaseUrl: string,
    private readonly port: number,
  ) {}

  /** Valide les variables et échoue au démarrage si l'une d'elles est invalide. */
  static fromVariables(variables: Record<string, string | undefined>): Environment {
    const result = environmentSchema.safeParse(variables);
    if (!result.success) {
      // Seuls les noms sont affichés : les valeurs peuvent contenir des secrets.
      const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Variables d'environnement invalides : ${names}`);
    }
    return new Environment(result.data.DATABASE_URL, result.data.PORT);
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  getPort(): number {
    return this.port;
  }
}
