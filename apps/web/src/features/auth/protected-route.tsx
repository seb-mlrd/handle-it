import { Navigate, Outlet, useLocation } from 'react-router';
import { LANDING_PATH } from '../layout/landing-path';
import { createLoginState } from './login-location';
import { SessionStatus } from './session-status';
import { useCurrentUser } from './use-current-user';

const HOME_PATH = '/';

// Après une déconnexion ou une session expirée, on revient à la connexion, pas à la vitrine.
let hasHadSession = false;

/** Réserve ses pages aux utilisateurs connectés. */
export function ProtectedRoute() {
  const location = useLocation();
  const { data: user, refetch } = useCurrentUser();
  if (user === undefined) return <SessionStatus retry={refetch} />;
  // Un nouveau visiteur qui arrive sur l'accueil découvre d'abord le produit.
  if (user) hasHadSession = true;
  if (!user && !hasHadSession && location.pathname === HOME_PATH) {
    window.location.replace(LANDING_PATH);
    return null;
  }
  if (!user) return <Navigate to="/login" replace state={createLoginState(location)} />;
  return <Outlet />;
}
