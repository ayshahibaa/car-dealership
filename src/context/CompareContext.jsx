import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CompareContext = createContext(null);

export const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [ids, setIdsState] = useState([]);

  const setIds = useCallback((next) => {
    setIdsState([...new Set(next)].slice(0, MAX_COMPARE));
  }, []);

  const add = useCallback((id) => {
    setIdsState((prev) => (prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id) => {
    setIdsState((prev) => prev.filter((existing) => existing !== id));
  }, []);

  const toggle = useCallback((id) => {
    setIdsState((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id],
    );
  }, []);

  const clear = useCallback(() => setIdsState([]), []);

  const value = useMemo(
    () => ({
      ids,
      count: ids.length,
      max: MAX_COMPARE,
      isFull: ids.length >= MAX_COMPARE,
      isSelected: (id) => ids.includes(id),
      add,
      remove,
      toggle,
      clear,
      setIds,
    }),
    [ids, add, remove, toggle, clear, setIds],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
