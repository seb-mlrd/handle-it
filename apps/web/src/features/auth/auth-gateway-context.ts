import { createContext, useContext } from 'react';
import type { AuthGateway } from './auth-gateway';

export const AuthGatewayContext = createContext<AuthGateway | null>(null);

export function useAuthGateway(): AuthGateway {
  const authGateway = useContext(AuthGatewayContext);
  if (!authGateway) {
    throw new Error('AuthGatewayContext doit être fourni au-dessus de ce composant');
  }
  return authGateway;
}
