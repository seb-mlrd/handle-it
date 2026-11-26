import type { ConnectionStatus } from './board-realtime-gateway';

const LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Connexion…',
  live: 'En direct',
  offline: 'Hors ligne, reconnexion…',
};

interface ConnectionIndicatorProps {
  readonly status: ConnectionStatus;
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted">
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${status === 'live' ? 'bg-accent' : 'border-2 border-control'}`}
      />
      {LABELS[status]}
    </p>
  );
}
