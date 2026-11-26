import { useSearchParams } from 'react-router';
import { MAIN_CONTENT_ID } from '../layout/skip-link';
import { AppHeader } from '../layout/app-header';
import { LoadError } from '../../shared/ui/load-error';
import { useToday } from '../due-date/use-today';
import { DueFilterSelect } from './due-filter-select';
import { readDueFilter } from './due-filter-options';
import { SearchResultItem } from './search-result-item';
import { isSearchable } from './search-text';
import { useSearch } from './use-search';

const describeCount = (count: number) =>
  count === 0
    ? 'Aucune carte trouvée.'
    : `${count} ${count === 1 ? 'carte trouvée' : 'cartes trouvées'}.`;

/** Résultats d'une recherche dans tous les tableaux ; la requête vit dans l'adresse. */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const due = readDueFilter(searchParams.get('due'));
  const today = useToday();
  const search = useSearch({ query, due, today });
  const changeDue = (value: typeof due) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('due', value);
    else next.delete('due');
    setSearchParams(next, { replace: true });
  };
  const results = isSearchable(query) ? search.data?.results : undefined;
  return (
    <>
      <title>{`Recherche${query ? ` « ${query} »` : ''} · Handle It`}</title>
      <AppHeader />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 outline-none"
      >
        <h1 className="text-display font-bold">Recherche</h1>
        <div className="max-w-xs">
          <DueFilterSelect value={due} change={changeDue} />
        </div>
        <p role="status" className="text-muted">
          {!isSearchable(query)
            ? 'Écris au moins deux caractères dans le champ de recherche.'
            : results
              ? describeCount(results.length)
              : search.isFetching
                ? 'Recherche…'
                : ''}
        </p>
        {search.error && !search.isFetching && (
          <LoadError error={search.error} isRetrying={search.isFetching} retry={search.refetch} />
        )}
        {results && results.length > 0 && (
          <ul aria-label="Résultats" className="flex flex-col gap-3">
            {results.map((result) => (
              <SearchResultItem key={result.cardId} result={result} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
