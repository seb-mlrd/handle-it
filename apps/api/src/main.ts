import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app-module.js';
import { Environment } from './config/environment.js';
import { configureApplication } from './configure-application.js';

const application = await NestFactory.create<NestExpressApplication>(AppModule);
configureApplication(application);
await application.listen(application.get(Environment).getPort());
