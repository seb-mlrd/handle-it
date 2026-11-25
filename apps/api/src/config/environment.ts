import { z } from 'zod';

const DEFAULT_PORT = 3001;
const DEFAULT_AUTH_ATTEMPTS_LIMIT = 10;

const LOCAL_HOSTNAME = 'localhost';

/** Une origine seule, en HTTPS sauf en local où le cookie ne peut pas être Secure. */
function isAllowedWebOrigin(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }
  const url = new URL(value);
  const isLocal = url.protocol === 'http:' && url.hostname === LOCAL_HOSTNAME;
  return url.origin === value && (url.protocol === 'https:' || isLocal);
}

const environmentSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
  AUTH_ATTEMPTS_LIMIT: z.coerce.number().int().min(1).default(DEFAULT_AUTH_ATTEMPTS_LIMIT),
  WEB_ORIGIN: z.string().refine(isAllowedWebOrigin),
});

/** Configuration validée de l'API, seule source des variables d'environnement. */
export class Environment {
  private constructor(
    private readonly databaseUrl: string,
    private readonly port: number,
    private readonly webOrigin: string,
    private readonly authAttemptsLimit: number,
  ) {}

  /** Valide les variables et échoue au démarrage si l'une d'elles est invalide. */
  static fromVariables(variables: Record<string, string | undefined>): Environment {
    const result = environmentSchema.safeParse(variables);
    if (!result.success) {
      // Seuls les noms sont affichés : les valeurs peuvent contenir des secrets.
      const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Variables d'environnement invalides : ${names}`);
    }
    return new Environment(
      result.data.DATABASE_URL,
      result.data.PORT,
      result.data.WEB_ORIGIN,
      result.data.AUTH_ATTEMPTS_LIMIT,
    );
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  getPort(): number {
    return this.port;
  }

  getWebOrigin(): string {
    return this.webOrigin;
  }

  /** Tentatives d'inscription ou de connexion permises par adresse IP et par période. */
  getAuthAttemptsLimit(): number {
    return this.authAttemptsLimit;
  }

  isWebOriginSecure(): boolean {
    return this.webOrigin.startsWith('https:');
  }
}
