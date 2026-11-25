import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DatabaseProbe } from './database-probe.js';

@Injectable()
export class PrismaDatabaseProbe extends DatabaseProbe {
  private readonly logger = new Logger(PrismaDatabaseProbe.name);

  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {
    super();
  }

  override async isReachable(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      // Le message brut peut contenir des détails de connexion : seul le type est journalisé.
      const errorName = error instanceof Error ? error.name : 'inconnue';
      this.logger.error(`Base de données injoignable (${errorName})`);
      return false;
    }
  }
}
