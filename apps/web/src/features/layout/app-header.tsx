import { Link } from 'react-router';
import { LogOutButton } from '../auth/log-out-button';
import { SearchField } from '../search/search-field';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
      <Link to="/" className="shrink-0 text-lg font-bold">
        Handle It
      </Link>
      <SearchField />
      <LogOutButton />
    </header>
  );
}
