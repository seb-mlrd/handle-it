import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useDebouncedValue } from '../../shared/time/use-debounced-value';
import { SEARCH_PATH } from './search-path';
import { SEARCH_DELAY_MILLISECONDS } from './search-text';
import { useSlashShortcut } from './use-slash-shortcut';

/** Champ de l'en-tête : sur la page de résultats, la recherche suit la frappe après une pause. */
export function SearchField() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnSearchPage = pathname === SEARCH_PATH;
  const urlQuery = isOnSearchPage ? (searchParams.get('q') ?? '') : '';
  const [text, setText] = useState(urlQuery);
  const debouncedText = useDebouncedValue(text, SEARCH_DELAY_MILLISECONDS);
  const fieldReference = useRef<HTMLInputElement>(null);
  useSlashShortcut(fieldReference);

  const showResults = (query: string, replace: boolean) => {
    const next = new URLSearchParams(isOnSearchPage ? searchParams : undefined);
    next.set('q', query);
    void navigate({ pathname: SEARCH_PATH, search: `?${next}` }, { replace });
  };

  useEffect(() => {
    if (isOnSearchPage && debouncedText !== urlQuery) showResults(debouncedText, true);
    // Seule la fin d'une pause de frappe relance l'effet, pas chaque rendu.
  }, [debouncedText]);

  return (
    <form
      role="search"
      className="min-w-0 grow sm:max-w-sm"
      onSubmit={(event) => {
        event.preventDefault();
        showResults(text, isOnSearchPage);
      }}
    >
      <input
        ref={fieldReference}
        type="search"
        aria-label="Rechercher une carte"
        aria-keyshortcuts="/"
        placeholder="Rechercher ( / )"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-11 w-full rounded-control border border-control bg-canvas px-3 text-base"
      />
    </form>
  );
}
