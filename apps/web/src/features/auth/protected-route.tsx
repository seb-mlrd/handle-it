import { Navigate, Outlet, useLocation } from 'react-router';
import { createLoginState } from './login-location';
import { SessionStatus } from './session-status';
import { useCurrentUser } from './use-current-user';

/** Réserve ses pages aux utilisateurs connectés. */
export function ProtectedRoute() {
  const location = useLocation();
  const { data: user, refetch } = useCurrentUser();
  if (user === undefined) return <SessionStatus retry={refetch} />;
  if (!user) return <Navigate to="/login" replace state={createLoginState(location)} />;
  return <Outlet />;
}
