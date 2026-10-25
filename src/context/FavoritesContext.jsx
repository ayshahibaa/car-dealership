import { createPersistedIdListContext } from './createPersistedIdListContext.jsx';

/**
 * Saved cars, persisted to localStorage so they survive a refresh (unlike
 * CompareContext, which is intentionally session-only). Not tied to login —
 * favouriting is a per-browser convenience, not account data — so it works
 * the same before and after signing in.
 */
const { Provider, useIdList } = createPersistedIdListContext('autoza.favorites');

export const FavoritesProvider = Provider;

export function useFavorites() {
  const { ids, count, has, add, remove, toggle, clear } = useIdList('useFavorites');
  return { ids, count, isFavorite: has, add, remove, toggle, clear };
}
