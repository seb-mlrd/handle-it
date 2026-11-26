import { describeDueDate, getDueStatus, type DueStatus } from './due-date-status';
import { useToday } from './use-today';

const STATUS_CLASSES: Record<DueStatus, string> = {
  overdue: 'bg-label-red text-on-label-red',
  today: 'bg-label-yellow text-on-label-yellow',
  tomorrow: 'bg-label-orange text-on-label-orange',
  later: 'bg-label-gray text-on-label-gray',
};

interface DueDateChipProps {
  readonly dueOn: string;
}

export function DueDateChip({ dueOn }: DueDateChipProps) {
  const today = useToday();
  return (
    <span
      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-sm font-medium ${STATUS_CLASSES[getDueStatus(dueOn, today)]}`}
    >
      {describeDueDate(dueOn, today)}
    </span>
  );
}
