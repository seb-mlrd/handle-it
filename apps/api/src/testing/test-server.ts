import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../app.module.js';
import { configureApplication } from '../configure-application.js';
import { PrismaService } from '../database/prisma.service.js';

export const WEB_ORIGIN = 'http://localhost:5173';

interface SendOptions {
  readonly body?: unknown;
  readonly cookie?: string;
  readonly origin?: string | null;
}

/** Application complète, démarrée sur un port libre et une base vidée. */
export class TestServer {
  private constructor(
    private readonly application: NestExpressApplication,
    private readonly baseUrl: string,
  ) {}

  static async start(): Promise<TestServer> {
    process.env['WEB_ORIGIN'] = WEB_ORIGIN;
    const application = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
      abortOnError: false,
    });
    configureApplication(application);
    await application.listen(0, '127.0.0.1');
    await application.get(PrismaService).user.deleteMany();
    return new TestServer(application, await application.getUrl());
  }

  getDatabase(): PrismaService {
    return this.application.get(PrismaService);
  }

  send(method: string, path: string, options: SendOptions = {}): Promise<Response> {
    const headers = new Headers({ 'content-type': 'application/json' });
    const origin = options.origin === undefined ? WEB_ORIGIN : options.origin;
    if (origin !== null) headers.set('origin', origin);
    if (options.cookie) headers.set('cookie', options.cookie);
    const body = options.body === undefined ? null : JSON.stringify(options.body);
    return fetch(`${this.baseUrl}/api${path}`, { method, headers, body });
  }

  async stop(): Promise<void> {
    await this.application.close();
  }
}
