import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module.js';
import { Environment } from './config/environment.js';

const application = await NestFactory.create(AppModule);
application.setGlobalPrefix('api');
application.enableShutdownHooks();
await application.listen(application.get(Environment).getPort());
