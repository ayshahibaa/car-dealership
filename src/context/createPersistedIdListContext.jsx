import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

function storageKeyFor(prefix, userId) {
  // Scoped per signed-in user (and separately for signed-out visitors) so
  // one account's saved cars never show up for the next account that signs
  // in on the same browser — a plain fixed key leaked between accounts.
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
  } catch {
    // Storage can be unavailable (private mode, blocked) — state just won't survive a refresh.
  }
  return ids;
}

/**
 * Builds a Context + Provider + hook for a simple persisted list of car ids.
 * Favourites and the cart are both "a set of car ids that outlives a page
 * change and a refresh" — this is the one implementation shared by both
 * (see FavoritesContext.jsx and CartContext.jsx), each with its own
 * localStorage key prefix and its own React context so they never share
 * state with each other. Must be rendered inside AuthProvider (see App.jsx)
 * since it reads the signed-in user to pick the right storage key.
 */
export function createPersistedIdListContext(storageKeyPrefix) {
  const Context = createContext(null);

  function Provider({ children }) {
    const { user } = useAuth();
    const storageKey = storageKeyFor(storageKeyPrefix, user?.id);
    const [ids, setIds] = useState(() => readIds(storageKey));

    // Re-read whenever the signed-in identity changes (login, logout, or
    // switching accounts) so this always reflects *that* identity's list
    // instead of whatever was loaded for the previous one.
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
