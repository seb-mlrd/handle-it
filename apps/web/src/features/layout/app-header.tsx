import { Link } from 'react-router';
import { Icon } from '../../shared/ui/icon';
import { LogOutButton } from '../auth/log-out-button';
import { SearchField } from '../search/search-field';
import { BrandMark } from './brand-mark';

interface AppHeaderProps {
  /** Page ouverte sous « Mes tableaux », affichée dans le fil d'Ariane. */
  readonly currentPage?: string | undefined;
}

/** En-tête collant et translucide : le contenu défile dessous sans perdre la navigation. */
export function AppHeader({ currentPage }: AppHeaderProps) {
  return (
    <header className="material sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-2 shadow-[0_1px_0_var(--color-line)] sm:px-6">
      <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center">
        <Link to="/" className="flex h-11 shrink-0 items-center gap-2.5 rounded-control pr-2">
          <BrandMark />
          <span className="font-bold tracking-[-0.01em] max-sm:sr-only">Handle It</span>
        </Link>
        {currentPage && (
          <>
            <Icon name="chevronRight" className="size-4 text-muted max-md:hidden" />
            <Link
              to="/"
              className="flex h-11 shrink-0 items-center rounded-control px-2 text-muted transition-colors hover:text-ink max-md:hidden"
            >
              Mes tableaux
            </Link>
            <Icon name="chevronRight" className="size-4 text-muted max-md:hidden" />
            <span aria-current="page" className="truncate px-2 font-medium max-md:hidden">
              {currentPage}
            </span>
          </>
        )}
      </nav>
      <div className="flex min-w-0 grow items-center justify-end gap-2">
        <SearchField />
        <LogOutButton />
      </div>
    </header>
  );
}
