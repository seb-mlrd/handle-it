import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/** Réglages communs au serveur et aux tests d'intégration. */
export function configureApplication(application: NestExpressApplication): void {
  application.setGlobalPrefix('api');
  application.disable('x-powered-by');
  application.use(cookieParser());
  application.enableShutdownHooks();
}
