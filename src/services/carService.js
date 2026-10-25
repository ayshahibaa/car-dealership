/**
 * carService.js — the single gateway between the UI and car data.
 *
 * BROWSING (getCars, getCarById, getFeaturedCars, ...): still reads the
 *   local demo dataset (src/data/cars.json via loadInventory.js). These
 *   function names, parameters and return shapes stay the same so pages
 *   and components don't need to change once a future phase wires reads
 *   over to the backend too.
 * MUTATING (createVehicle, requestPurchase, ...): calls the real backend
 *   (Phases B1-B5) via apiClient.js, because "listing a car" or "buying a
 *   car" has to actually touch server-side state — a local-only demo can't
 *   fake that. The ids match: the backend was seeded from this same
 *   dataset with each car's original id preserved (see
 *   backend/src/data/mapLegacyVehicle.ts), so a car's id here is the same
 *   id the backend knows it by. Listing a car and buying one both go
 *   through admin approval now (see getCommunityListings and
 *   requestPurchase) rather than taking effect immediately.
 */
import { appConfig } from '../config/appConfig.js';
import { loadInventory, findCar } from '../data/loadInventory.js';
import { queryCars, sortCars, SORT_OPTIONS } from './filterCars.js';
import { apiFetch } from './apiClient.js';

export { SORT_OPTIONS };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const simulateNetwork = () => wait(appConfig.demo.simulatedLatencyMs);

/**
 * Search the inventory.
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export async function getCars(query = {}) {
  await simulateNetwork();
  const { cars } = await loadInventory();
  const available = cars.filter((c) => c.listingStatus === 'available');
  return queryCars(available, { pageSize: appConfig.inventory.pageSize, ...query });
}

/**
 * One car by id (UUID) or stock number. Checks the local demo dataset
 * first; a miss falls back to the real backend, since admin-approved
 * "sell your car" listings only ever exist there (see getCommunityListings).
 * @returns {Promise<object|null>} null when no such car exists
 */
export async function getCarById(id) {
  await simulateNetwork();
  if (!id) return null;
  const local = await findCar(String(id));
  if (local) return local;
  try {
    return await apiFetch(`/vehicles/${id}`);
  } catch {
    return null;
  }
}

/** Several cars by id, in the order given — used by favourites/cart/compare. */
export async function getCarsByIds(ids = []) {
  await simulateNetwork();
  const found = await Promise.all(ids.map((id) => getCarById(id)));
  return found.filter(Boolean);
}

/**
 * Featured listings: newest, accident-free cars with no data warnings,
 * at most one per make so the selection looks varied.
 */
export async function getFeaturedCars(limit = 8) {
  await simulateNetwork();
  const { cars } = await loadInventory();
  const seenMakes = new Set();
  const picks = [];
  const candidates = sortCars(
    cars.filter((c) => c.accidentHistory === 'none-reported' && c.dataFlags.length === 0 && c.listingStatus === 'available'),
    'year-desc',
  );
  for (const car of candidates) {
    if (seenMakes.has(car.make)) continue;
    seenMakes.add(car.make);
    picks.push(car);
    if (picks.length === limit) break;
  }
  return picks;
}

/** Most recently listed cars. */
export async function getRecentCars(limit = 8) {
  return (await getCars({ sort: 'recent', pageSize: limit })).items;
}

/** Options and ranges for search/filter controls, built from the data. */
export async function getFilterOptions() {
  await simulateNetwork();
  const { cars } = await loadInventory();
  const count = (field) => {
    const map = new Map();
    for (const c of cars) if (c[field] != null) map.set(c[field], (map.get(c[field]) ?? 0) + 1);
    return [...map.entries()]
      .map(([value, total]) => ({ value, count: total }))
      .sort((a, b) => String(a.value).localeCompare(String(b.value)));
  };
  const range = (field) => {
    const values = cars.map((c) => c[field]).filter((v) => typeof v === 'number');
    return { min: Math.min(...values), max: Math.max(...values) };
  };
  const modelsByMake = {};
  for (const { make, model } of cars) (modelsByMake[make] ??= new Set()).add(model);

  return {
    makes: count('make'),
    modelsByMake: Object.fromEntries(Object.entries(modelsByMake).map(([m, s]) => [m, [...s].sort()])),
    bodyTypes: count('bodyType'),
    fuelTypes: count('fuelType'),
    transmissions: count('transmission'),
    drivetrains: count('drivetrain'),
    colors: count('exteriorColorFamily'),
    price: range('price'),
    year: range('year'),
    mileage: range('mileage'),
    sortOptions: Object.entries(SORT_OPTIONS).map(([value, { label }]) => ({ value, label })),
  };
}

// ---------------------------------------------------------------------------
// Vehicle CRUD, purchase & restock — real backend (see file comment above)
// ---------------------------------------------------------------------------

/**
 * List your own car for sale. Any logged-in user may call this — see
 * SellCarPage.jsx. `token` is the caller's JWT from useAuth().
 * @returns {Promise<object>} the created vehicle (as the backend stores it)
 */
export function createVehicle(data, token) {
  return apiFetch('/vehicles', { method: 'POST', body: data, token });
}

/** Admin-only on the backend; the UI only shows this action to admins (see AdminDashboardPage). */
export function deleteVehicle(id, token) {
  return apiFetch(`/vehicles/${id}`, { method: 'DELETE', token });
}

/** Admin-only on the backend: resets a sold car's stock back to available. */
export function restockVehicle(id, token) {
  return apiFetch(`/vehicles/${id}/restock`, { method: 'POST', token });
}

/** Admin-only on the backend: every vehicle including sold ones, for the admin dashboard. */
export function getAllVehiclesForAdmin(token) {
  return apiFetch('/vehicles/admin/all', { token });
}

/** Admin-only on the backend: listings awaiting moderation ("sell your car" submissions). */
export function getPendingVehicles(token) {
  return apiFetch('/vehicles/admin/pending', { token });
}

/** Admin-only on the backend: makes a pending listing start showing up in public listings. */
export function approveVehicleListing(id, token) {
  return apiFetch(`/vehicles/${id}/approve`, { method: 'POST', token });
}

/** Admin-only on the backend: rejects a pending listing — stays in the database, never goes public. */
export function rejectVehicleListing(id, token) {
  return apiFetch(`/vehicles/${id}/reject`, { method: 'POST', token });
}

/**
 * Recently listed, admin-approved cars submitted through "sell your car" —
 * the one place the real backend's inventory becomes visible in the demo
 * catalog (everything else on /cars reads the fixed local dataset; see this
 * file's header comment). Filters to listings that actually have a seller
 * (listedById set), since the seeded demo dataset is also "approved" but
 * isn't a community listing.
 */
export async function getCommunityListings(limit = 8) {
  const vehicles = await apiFetch('/vehicles');
  return vehicles
    .filter((v) => v.listedById)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Purchase requests — buying no longer completes instantly. It files a
// request; an admin approving it is what actually decrements stock.
// ---------------------------------------------------------------------------

/** Request to buy a car: any logged-in user. Rejects (409) if out of stock, already requested, or it's your own listing. */
export function requestPurchase(vehicleId, token) {
  return apiFetch('/purchase-requests', { method: 'POST', body: { vehicleId }, token });
}

/** The caller's own purchase requests (pending, approved and rejected) — used by the "My orders" page. */
export function getMyPurchaseRequests(token) {
  return apiFetch('/purchase-requests/mine', { token });
}

/** Admin-only on the backend: every pending purchase request, for the admin dashboard. */
export function getPendingPurchaseRequests(token) {
  return apiFetch('/purchase-requests/pending', { token });
}

/** Admin-only on the backend: approving is what actually decrements the vehicle's stock. */
export function approvePurchaseRequest(id, token) {
  return apiFetch(`/purchase-requests/${id}/approve`, { method: 'POST', token });
}

/** Admin-only on the backend: rejects the request; the vehicle's stock is untouched. */
export function rejectPurchaseRequest(id, token) {
  return apiFetch(`/purchase-requests/${id}/reject`, { method: 'POST', token });
}
