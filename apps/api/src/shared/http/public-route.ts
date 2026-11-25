import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE_KEY = 'publicRoute';

/** Dispense une route de la session exigée par défaut. */
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
