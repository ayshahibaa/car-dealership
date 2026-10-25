/**
 * filterCars.js — pure search / filter / sort / paginate logic.
 *
 * It has no React and no storage, so it is easy to test and the backend
 * developer can mirror the same rules in GET /api/cars.
 *
 * Query parameters (all optional):
 *   q             free text: matches title, make, model, variant, stock number
 *   make, model   exact match (case-insensitive)
 *   bodyType, fuelType, transmission, drivetrain, color   one value or an array
 *   minPrice, maxPrice, minYear, maxYear, maxMileage       numbers
 *   sort          one of SORT_OPTIONS keys
 *   page, pageSize
 */

export const SORT_OPTIONS = Object.freeze({
  recent: { label: 'Recently added', compare: (a, b) => b.listedAt.localeCompare(a.listedAt) || a.stockNumber.localeCompare(b.stockNumber) },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  'year-desc': { label: 'Year: newest first', compare: (a, b) => b.year - a.year || a.price - b.price },
  'year-asc': { label: 'Year: oldest first', compare: (a, b) => a.year - b.year || a.price - b.price },
  'mileage-asc': { label: 'Mileage: lowest first', compare: (a, b) => a.mileage - b.mileage },
});

const toList = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]);
const toNumber = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const norm = (s) => String(s ?? '').toLowerCase();

function matchesAny(value, wanted) {
  const list = toList(wanted).map(norm);
  return list.length === 0 || list.includes(norm(value));
}

export function filterCars(cars, query = {}) {
  const terms = norm(query.q).split(/\s+/).filter(Boolean);
  const minPrice = toNumber(query.minPrice);
  const maxPrice = toNumber(query.maxPrice);
  const minYear = toNumber(query.minYear);
  const maxYear = toNumber(query.maxYear);
  const maxMileage = toNumber(query.maxMileage);

  return cars.filter((car) => {
    if (terms.length) {
      const haystack = norm(`${car.title} ${car.make} ${car.model} ${car.variant ?? ''} ${car.stockNumber}`);
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (!matchesAny(car.make, query.make)) return false;
    if (!matchesAny(car.model, query.model)) return false;
    if (!matchesAny(car.bodyType, query.bodyType)) return false;
    if (!matchesAny(car.fuelType, query.fuelType)) return false;
    if (!matchesAny(car.transmission, query.transmission)) return false;
    if (!matchesAny(car.drivetrain, query.drivetrain)) return false;
    if (!matchesAny(car.exteriorColorFamily, query.color)) return false;
    if (minPrice !== null && car.price < minPrice) return false;
    if (maxPrice !== null && car.price > maxPrice) return false;
    if (minYear !== null && car.year < minYear) return false;
    if (maxYear !== null && car.year > maxYear) return false;
    if (maxMileage !== null && car.mileage > maxMileage) return false;
    return true;
  });
}

export function sortCars(cars, sortKey = 'recent') {
  const option = SORT_OPTIONS[sortKey] ?? SORT_OPTIONS.recent;
  return [...cars].sort(option.compare);
}

export function paginate(items, page = 1, pageSize = 12) {
  const size = Math.max(1, Math.min(100, Number(pageSize) || 12));
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    total: items.length,
    page: current,
    pageSize: size,
    totalPages,
  };
}

/** Full pipeline: filter -> sort -> paginate. */
export function queryCars(cars, query = {}) {
  const filtered = filterCars(cars, query);
  const sorted = sortCars(filtered, query.sort);
  return paginate(sorted, query.page, query.pageSize);
}
