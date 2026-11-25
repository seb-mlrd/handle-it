import { Global, Module } from '@nestjs/common';
import { Environment } from './environment.js';

@Global()
@Module({
  providers: [{ provide: Environment, useFactory: () => Environment.fromVariables(process.env) }],
  exports: [Environment],
})
export class EnvironmentModule {}
