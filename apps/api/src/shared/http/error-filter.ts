import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorResponseMapper } from './error-response-mapper.js';

interface JsonResponse {
  readonly headersSent: boolean;
  status(code: number): JsonResponse;
  json(body: unknown): void;
}

/** Point de sortie unique des erreurs HTTP. */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);
  private readonly mapper = new ErrorResponseMapper();

  catch(error: unknown, host: ArgumentsHost): void {
    const { status, body } = this.mapper.map(error);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logUnexpected(error);
    }
    const response = host.switchToHttp().getResponse<JsonResponse>();
    if (!response.headersSent) {
      response.status(status).json(body);
    }
  }

  private logUnexpected(error: unknown): void {
    if (!(error instanceof Error)) {
      this.logger.error('Erreur inattendue de type inconnu');
      return;
    }
    // Le message peut contenir des données personnelles : seules les lignes d'appel sont gardées.
    const frames = error.stack?.split('\n').filter((line) => line.trimStart().startsWith('at '));
    this.logger.error(`Erreur inattendue (${error.name})\n${frames?.join('\n') ?? ''}`);
  }
}
