import { getErrorMessage } from '../../shared/http/error-message';
import { formatFullDate, formatRelativeTime } from '../../shared/time/relative-time';
import { useNow } from '../../shared/time/use-now';
import { Button } from '../../shared/ui/button';
import { LoadError } from '../../shared/ui/load-error';
import { describeActivity, FORMER_MEMBER_NAME } from './activity-sentence';
import { useActivities } from './use-activities';

interface ActivityListProps {
  readonly boardId: string;
  readonly cardId: string | null;
  readonly emptyMessage: string;
}

export function ActivityList({ boardId, cardId, emptyMessage }: ActivityListProps) {
  const now = useNow();
  const activities = useActivities(boardId, cardId);
  if (!activities.data) {
    return activities.error ? (
      <LoadError
        error={activities.error}
        isRetrying={activities.isFetching}
        retry={activities.refetch}
      />
    ) : (
      <p role="status" className="text-muted">
        Chargement de l'activité…
      </p>
    );
  }
  const items = activities.data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <p className="text-muted">{emptyMessage}</p>;
  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Activité" className="flex flex-col divide-y divide-line">
        {items.map((activity) => (
          <li key={activity.id} className="flex flex-col gap-0.5 py-2.5">
            <p className="wrap-anywhere">
              <span className="font-semibold">{activity.actorName ?? FORMER_MEMBER_NAME}</span>{' '}
              {describeActivity(activity.details)}
            </p>
            <time
              dateTime={activity.createdAt}
              title={formatFullDate(activity.createdAt)}
              className="text-sm text-muted"
            >
              {formatRelativeTime(activity.createdAt, now)}
            </time>
          </li>
        ))}
      </ol>
      {activities.hasNextPage && (
        <div className="flex flex-col items-start gap-2">
          <Button
            variant="secondary"
            disabled={activities.isFetchingNextPage}
            onClick={() => void activities.fetchNextPage()}
          >
            {activities.isFetchingNextPage ? 'Chargement…' : "Charger plus d'activité"}
          </Button>
          <span role="alert" className="text-sm text-danger">
            {activities.isFetchNextPageError && getErrorMessage(activities.error)}
          </span>
        </div>
      )}
    </div>
  );
}
