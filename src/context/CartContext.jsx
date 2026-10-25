import { createPersistedIdListContext } from './createPersistedIdListContext.jsx';

/**
 * Cars added to the cart, persisted to localStorage (same shape as
 * FavoritesContext) so an anonymous visitor can build up a cart before
 * ever signing in. Adding/removing never requires a login — only checking
 * out does, which CartPage enforces the same way PurchaseButton already
 * does for an instant "Buy now".
 */
const { Provider, useIdList } = createPersistedIdListContext('autoza.cart');

export const CartProvider = Provider;

export function useCart() {
  const { ids, count, has, add, remove, toggle, clear } = useIdList('useCart');
  return { ids, count, isInCart: has, add, remove, toggle, clear };
}
