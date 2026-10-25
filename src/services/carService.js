import { appConfig } from '../config/appConfig.js';
import { loadInventory, findCar } from '../data/loadInventory.js';
import { queryCars, sortCars, SORT_OPTIONS } from './filterCars.js';
import { apiFetch } from './apiClient.js';

export { SORT_OPTIONS };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const simulateNetwork = () => wait(appConfig.demo.simulatedLatencyMs);

export async function getCars(query = {}) {
  await simulateNetwork();
  const { cars } = await loadInventory();
  const available = cars.filter((c) => c.listingStatus === 'available');
  return queryCars(available, { pageSize: appConfig.inventory.pageSize, ...query });
}

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

export async function getCarsByIds(ids = []) {
  await simulateNetwork();
  const found = await Promise.all(ids.map((id) => getCarById(id)));
  return found.filter(Boolean);
}

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

export async function getRecentCars(limit = 8) {
  return (await getCars({ sort: 'recent', pageSize: limit })).items;
}

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

export function createVehicle(data, token) {
  return apiFetch('/vehicles', { method: 'POST', body: data, token });
}

export function deleteVehicle(id, token) {
  return apiFetch(`/vehicles/${id}`, { method: 'DELETE', token });
}

export function restockVehicle(id, token) {
  return apiFetch(`/vehicles/${id}/restock`, { method: 'POST', token });
}

export function getAllVehiclesForAdmin(token) {
  return apiFetch('/vehicles/admin/all', { token });
}

export function getPendingVehicles(token) {
  return apiFetch('/vehicles/admin/pending', { token });
}

export function approveVehicleListing(id, token) {
  return apiFetch(`/vehicles/${id}/approve`, { method: 'POST', token });
}

export function rejectVehicleListing(id, token) {
  return apiFetch(`/vehicles/${id}/reject`, { method: 'POST', token });
}

export async function getCommunityListings(limit = 8) {
  const vehicles = await apiFetch('/vehicles');
  return vehicles
    .filter((v) => v.listedById)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function requestPurchase(vehicleId, token) {
  return apiFetch('/purchase-requests', { method: 'POST', body: { vehicleId }, token });
}

export function getMyPurchaseRequests(token) {
  return apiFetch('/purchase-requests/mine', { token });
}

export function getPendingPurchaseRequests(token) {
  return apiFetch('/purchase-requests/pending', { token });
}

export function approvePurchaseRequest(id, token) {
  return apiFetch(`/purchase-requests/${id}/approve`, { method: 'POST', token });
}

export function rejectPurchaseRequest(id, token) {
  return apiFetch(`/purchase-requests/${id}/reject`, { method: 'POST', token });
}
