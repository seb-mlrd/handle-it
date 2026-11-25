import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module.js';

const DEFAULT_PORT = 3001;

const application = await NestFactory.create(AppModule);
await application.listen(DEFAULT_PORT);
