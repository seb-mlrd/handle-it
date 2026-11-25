import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Environment } from '../config/environment.js';
import { PrismaClient } from '../generated/prisma/client.js';

const DATABASE_TIMEOUT_MILLISECONDS = 2000;

/** Connexion partagée à PostgreSQL, fermée avec l'application. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(Environment) environment: Environment) {
    const adapter = new PrismaPg({
      connectionString: environment.getDatabaseUrl(),
      connectionTimeoutMillis: DATABASE_TIMEOUT_MILLISECONDS,
      query_timeout: DATABASE_TIMEOUT_MILLISECONDS,
    });
    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
