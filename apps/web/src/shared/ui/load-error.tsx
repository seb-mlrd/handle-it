import { getErrorMessage } from '../http/error-message';
import { Button } from './button';

interface LoadErrorProps {
  readonly error: unknown;
  readonly isRetrying: boolean;
  readonly retry: () => unknown;
}

export function LoadError({ error, isRetrying, retry }: LoadErrorProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p role="alert">{getErrorMessage(error)}</p>
      <Button disabled={isRetrying} onClick={() => void retry()}>
        Réessayer
      </Button>
    </div>
  );
}
