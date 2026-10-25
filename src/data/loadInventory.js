import { validateCar } from '../utils/validateCar.js';

let cachePromise = null;

export function loadInventory() {
  cachePromise ??= import('./cars.json').then(({ default: inventory }) => {
    const cars = [];
    const rejected = [];
    for (const car of inventory.cars ?? []) {
      const result = validateCar(car);
      if (result.valid) cars.push(Object.freeze(car));
      else rejected.push({ id: car?.id ?? null, errors: result.errors });
    }
    if (rejected.length && import.meta.env?.DEV) {
      console.warn(`[inventory] ${rejected.length} record(s) failed validation`, rejected);
    }
    return Object.freeze({ meta: inventory.meta, cars: Object.freeze(cars), rejected });
  });
  cachePromise.catch(() => {
    cachePromise = null;
  });
  return cachePromise;
}

export async function findCar(idOrStockNumber) {
  const { cars } = await loadInventory();
  return cars.find((c) => c.id === idOrStockNumber || c.stockNumber === idOrStockNumber) ?? null;
}
