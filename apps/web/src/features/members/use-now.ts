import { useEffect, useState } from 'react';

const REFRESH_MILLISECONDS = 30_000;

/** Heure courante, rafraîchie assez souvent pour un temps restant affiché à la minute. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MILLISECONDS);
    return () => clearInterval(timer);
  }, []);
  return now;
}
