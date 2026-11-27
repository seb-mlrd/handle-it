import type { SearchMatch, SearchResult } from '@handle-it/contracts';
import { Link } from 'react-router';
import { ExcerptText } from './excerpt-text';

const MATCH_LABELS: Record<Exclude<SearchMatch, 'title'>, string> = {
  description: 'Dans la description',
  comment: 'Dans un commentaire',
};

interface SearchResultItemProps {
  readonly result: SearchResult;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  return (
    <li>
      <Link
        to={`/boards/${result.boardId}/cards/${result.cardId}`}
        className="flex flex-col gap-1 rounded-card bg-surface p-4 shadow-raised transition-[box-shadow,translate,scale] hover:shadow-lifted motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.99] motion-reduce:transition-none"
      >
        <span className="font-semibold wrap-anywhere">
          {result.matchedIn === 'title' ? (
            <ExcerptText segments={result.excerpt} />
          ) : (
            result.cardTitle
          )}
        </span>
        <span className="text-sm text-muted wrap-anywhere">
          {result.boardName} · {result.columnName}
        </span>
        {result.matchedIn !== 'title' && (
          <span className="wrap-anywhere">
            <span className="text-sm text-muted">{MATCH_LABELS[result.matchedIn]} : </span>
            <ExcerptText segments={result.excerpt} />
          </span>
        )}
      </Link>
    </li>
  );
}
