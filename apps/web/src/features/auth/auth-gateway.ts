import {
  type LogInRequest,
  type RegisterRequest,
  type UserResponse,
  userResponseSchema,
} from '@handle-it/contracts';
import type { ApiClient } from '../../shared/http/api-client';
import { ApiError } from '../../shared/http/api-error';

/** Accès aux routes d'authentification. */
export class AuthGateway {
  constructor(private readonly apiClient: ApiClient) {}

  register(request: RegisterRequest): Promise<UserResponse> {
    return this.apiClient.post('/auth/register', request, userResponseSchema);
  }

  logIn(request: LogInRequest): Promise<UserResponse> {
    return this.apiClient.post('/auth/login', request, userResponseSchema);
  }

  logOut(): Promise<void> {
    return this.apiClient.postWithoutResult('/auth/logout');
  }

  /** Renvoie `null` sans session : un visiteur non connecté n'est pas une erreur. */
  async getCurrentUser(): Promise<UserResponse | null> {
    try {
      return await this.apiClient.get('/auth/me', userResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.getCode() === 'UNAUTHENTICATED') {
        return null;
      }
      throw error;
    }
  }
}
