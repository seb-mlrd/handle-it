import { useEffect, useState } from 'react';
import { toLocalDate } from './due-date-status';

/** Jour local du visiteur, mis à jour au passage de minuit, page ouverte. */
export function useToday(): string {
  const [today, setToday] = useState(() => toLocalDate(new Date()));
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(
      () => setToday(toLocalDate(new Date())),
      midnight.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [today]);
  return today;
}
