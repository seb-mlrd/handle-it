import { AsyncLocalStorage } from 'node:async_hooks';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

/** Fait partager une transaction à tous les repositories appelés pendant son exécution. */
@Injectable()
export class TransactionContext {
  private readonly storage = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  /** Client de la transaction en cours, ou client ordinaire hors transaction. */
  getClient(): Prisma.TransactionClient {
    return this.storage.getStore() ?? this.prismaService;
  }

  /** Exécute le travail dans une transaction annulée à la première erreur. */
  run<Result>(work: () => Promise<Result>): Promise<Result> {
    return this.prismaService.$transaction((client) => this.storage.run(client, work));
  }

  /** Donne à toutes les lectures la même image de la base. */
  runSnapshot<Result>(work: () => Promise<Result>): Promise<Result> {
    return this.prismaService.$transaction((client) => this.storage.run(client, work), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  }
}
