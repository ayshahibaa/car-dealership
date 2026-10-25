import { createPersistedIdListContext } from './createPersistedIdListContext.jsx';

const { Provider, useIdList } = createPersistedIdListContext('autoza.favorites');

export const FavoritesProvider = Provider;

export function useFavorites() {
  const { ids, count, has, add, remove, toggle, clear } = useIdList('useFavorites');
  return { ids, count, isFavorite: has, add, remove, toggle, clear };
}
