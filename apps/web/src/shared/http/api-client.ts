import { errorResponseSchema } from '@handle-it/contracts';
import type { z } from 'zod';
import { ApiError } from './api-error';

const REQUEST_TIMEOUT_MILLISECONDS = 10_000;

/** Seul point d'accès à l'API : délai maximal, erreurs typées et réponses validées. */
export class ApiClient {
  constructor(private readonly fetchRequest: typeof fetch) {}

  async get<Output>(path: string, schema: z.ZodType<Output>): Promise<Output> {
    return this.parse(await this.send('GET', path), schema);
  }

  async post<Output>(path: string, body: unknown, schema: z.ZodType<Output>): Promise<Output> {
    return this.parse(await this.send('POST', path, body), schema);
  }

  async patch<Output>(path: string, body: unknown, schema: z.ZodType<Output>): Promise<Output> {
    return this.parse(await this.send('PATCH', path, body), schema);
  }

  async delete(path: string): Promise<void> {
    await this.send('DELETE', path);
  }

  /** Envoie une écriture dont la réponse est vide. */
  async postWithoutResult(path: string): Promise<void> {
    await this.send('POST', path);
  }

  private async send(method: string, path: string, body?: unknown): Promise<Response> {
    const response = await this.request(method, path, body);
    if (!response.ok) {
      throw await this.toApiError(response);
    }
    return response;
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const content =
      body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } };
    try {
      const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS);
      return await this.fetchRequest(`/api${path}`, { method, signal, ...content });
    } catch {
      throw new ApiError('UNREACHABLE');
    }
  }

  private async toApiError(response: Response): Promise<ApiError> {
    const result = errorResponseSchema.safeParse(await this.readJson(response));
    return result.success
      ? new ApiError(result.data.code, result.data.fieldErrors)
      : new ApiError('UNREACHABLE');
  }

  private async parse<Output>(response: Response, schema: z.ZodType<Output>): Promise<Output> {
    const result = schema.safeParse(await this.readJson(response));
    if (!result.success) {
      throw new ApiError('UNREACHABLE');
    }
    return result.data;
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      // Un proxy peut répondre en HTML ou couper la réponse : ce n'est pas une réponse de l'API.
      throw new ApiError('UNREACHABLE');
    }
  }
}
