import { LogOutButton } from '../auth/log-out-button';
import { useCurrentUser } from '../auth/use-current-user';

// TODO: remplacer par la liste des boards (étape 2.1 du plan)
export function HomePage() {
  const { data: user } = useCurrentUser();
  return (
    <>
      <title>Accueil · Handle It</title>
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
        <p className="text-lg font-bold">Handle It</p>
        <LogOutButton />
      </header>
      <main className="px-6 py-10">
        <h1 className="text-display font-bold wrap-anywhere">Bonjour {user?.displayName}</h1>
        <p className="mt-2 text-muted">Tes tableaux apparaîtront ici.</p>
      </main>
    </>
  );
}
