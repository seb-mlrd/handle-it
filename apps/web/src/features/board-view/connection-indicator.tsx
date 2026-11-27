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
    <p
      role="status"
      className={`flex h-7 items-center gap-2 rounded-full pr-3 pl-2.5 text-sm font-medium ${status === 'live' ? 'bg-label-green text-on-label-green' : 'bg-label-gray text-on-label-gray'}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${status === 'live' ? 'bg-current' : 'border-[1.5px] border-current'}`}
      />
      {LABELS[status]}
    </p>
  );
}
