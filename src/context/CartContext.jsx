import { createPersistedIdListContext } from './createPersistedIdListContext.jsx';

const { Provider, useIdList } = createPersistedIdListContext('autoza.cart');

export const CartProvider = Provider;

export function useCart() {
  const { ids, count, has, add, remove, toggle, clear } = useIdList('useCart');
  return { ids, count, isInCart: has, add, remove, toggle, clear };
}
