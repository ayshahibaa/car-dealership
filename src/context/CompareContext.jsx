import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Holds the set of car ids selected for comparison.
 *
 * This lives above the router (see App.jsx) rather than inside a single page,
 * because — unlike favouriting, which CarCard keeps as a controlled prop
 * owned by whichever page renders it — a comparison needs to survive moving
 * from the homepage to the inventory grid and on to /compare. It is
 * session-only (in memory, not localStorage), matching how Favourites works
 * today; Phase 8 can revisit persisting both the same way.
 */
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
