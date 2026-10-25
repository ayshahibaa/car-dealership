/**
 * loadInventory.js — the ONLY place that reads the local demo dataset.
 *
 * UI components never import cars.json directly; they call
 * src/services/carService.js, which calls these functions. When the backend
 * exists, carService switches to the API and this file can retire.
 *
 * cars.json is loaded with a dynamic import(), so Vite puts it in its own
 * file that is downloaded only when data is first needed (keeps the initial
 * page load small).
 */
import { validateCar } from '../utils/validateCar.js';

let cachePromise = null;

/**
 * Resolves to { meta, cars, rejected }. `cars` are records that passed
 * validation; invalid records are kept in `rejected` (never silently lost)
 * and reported once in the browser console during development.
 */
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
  // If loading fails, allow a retry on the next call
  cachePromise.catch(() => {
    cachePromise = null;
  });
  return cachePromise;
}

/** Look up one car by its stable id (UUID) or stock number (CAR-0001). */
export async function findCar(idOrStockNumber) {
  const { cars } = await loadInventory();
  return cars.find((c) => c.id === idOrStockNumber || c.stockNumber === idOrStockNumber) ?? null;
}
