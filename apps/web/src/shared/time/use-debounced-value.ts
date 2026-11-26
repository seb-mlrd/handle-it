import { useEffect, useState } from 'react';

/** Valeur qui ne suit l'originale qu'après une pause : une frappe rapide n'envoie qu'une requête. */
export function useDebouncedValue<Value>(value: Value, delayMilliseconds: number): Value {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMilliseconds);
    return () => clearTimeout(timer);
  }, [value, delayMilliseconds]);
  return debouncedValue;
}
