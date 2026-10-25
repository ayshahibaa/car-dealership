import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

function storageKeyFor(prefix, userId) {
  return `${prefix}.${userId ?? 'guest'}`;
}

function readIds(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function persist(storageKey, ids) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {}
  return ids;
}

export function createPersistedIdListContext(storageKeyPrefix) {
  const Context = createContext(null);

  function Provider({ children }) {
    const { user } = useAuth();
    const storageKey = storageKeyFor(storageKeyPrefix, user?.id);
    const [ids, setIds] = useState(() => readIds(storageKey));

    useEffect(() => {
      setIds(readIds(storageKey));
    }, [storageKey]);

    const update = useCallback(
      (updater) => {
        setIds((prev) => persist(storageKey, typeof updater === 'function' ? updater(prev) : updater));
      },
      [storageKey],
    );

    const add = useCallback((id) => update((prev) => (prev.includes(id) ? prev : [...prev, id])), [update]);
    const remove = useCallback((id) => update((prev) => prev.filter((existing) => existing !== id)), [update]);
    const toggle = useCallback(
      (id) => update((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id])),
      [update],
    );
    const clear = useCallback(() => update([]), [update]);

    const value = useMemo(
      () => ({ ids, count: ids.length, has: (id) => ids.includes(id), add, remove, toggle, clear }),
      [ids, add, remove, toggle, clear],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useIdList(hookName) {
    const ctx = useContext(Context);
    if (!ctx) throw new Error(`${hookName} must be used within its provider`);
    return ctx;
  }

  return { Provider, useIdList };
}
