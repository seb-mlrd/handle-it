import { Navigate, Outlet, useLocation } from 'react-router';
import { readReturnPath } from './login-location';
import { SessionStatus } from './session-status';
import { useCurrentUser } from './use-current-user';

/** Réserve ses pages aux visiteurs ; après connexion, ramène à la page demandée. */
export function GuestRoute() {
  const { state } = useLocation();
  const { data: user, refetch } = useCurrentUser();
  if (user === undefined) return <SessionStatus retry={refetch} />;
  if (user) return <Navigate to={readReturnPath(state)} replace />;
  return <Outlet />;
}
