export const ALLOWED = Object.freeze({
  fuelType: ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'],
  transmission: ['Automatic', 'Manual', 'CVT', 'Dual-clutch'],
  drivetrain: ['AWD', 'FWD', 'RWD', '4WD'],
  bodyType: ['SUV', 'Sedan', 'Coupe', 'Truck', 'Hatchback', 'Wagon', 'Convertible', 'Minivan', 'Van'],
  exteriorColorFamily: ['Black', 'White', 'Gray', 'Silver', 'Blue', 'Red', 'Green', 'Brown',
    'Beige', 'Orange', 'Yellow', 'Purple'],
  condition: ['Used', 'New', 'Certified Pre-Owned'],
  accidentHistory: ['none-reported', 'reported'],
  listingStatus: ['available', 'reserved', 'sold', 'draft'],
  imageKind: ['photo', 'illustration'],
});

export const LIMITS = Object.freeze({
  minYear: 1980,
  maxYearAhead: 1,
  minPrice: 500,
  maxPrice: 2_000_000,
  maxMileage: 500_000,
  minEngineL: 0.6,
  maxEngineL: 8.5,
});

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const isInt = (v) => Number.isInteger(v);

export function validateCar(car, { currentYear = new Date().getFullYear() } = {}) {
  const errors = [];
  const warnings = [];

  if (!car || typeof car !== 'object') {
    return { valid: false, errors: ['record is not an object'], warnings };
  }

  for (const field of ['id', 'title', 'make', 'model', 'year', 'price', 'mileage', 'bodyType', 'condition', 'listingStatus']) {
    if (isBlank(car[field])) errors.push(`${field} is required`);
  }

  if (!isBlank(car.year)) {
    if (!isInt(car.year)) errors.push('year must be an integer');
    else if (car.year < LIMITS.minYear || car.year > currentYear + LIMITS.maxYearAhead) {
      errors.push(`year ${car.year} is outside ${LIMITS.minYear}–${currentYear + LIMITS.maxYearAhead}`);
    }
  }
  if (!isBlank(car.price)) {
    if (typeof car.price !== 'number' || Number.isNaN(car.price)) errors.push('price must be a number');
    else if (car.price < LIMITS.minPrice || car.price > LIMITS.maxPrice) errors.push(`price ${car.price} is implausible`);
  }
  if (!isBlank(car.mileage)) {
    if (!isInt(car.mileage) || car.mileage < 0) errors.push('mileage must be a non-negative integer');
    else if (car.mileage > LIMITS.maxMileage) errors.push(`mileage ${car.mileage} is implausible`);
  }
  if (car.engineCapacityL != null &&
      (car.engineCapacityL < LIMITS.minEngineL || car.engineCapacityL > LIMITS.maxEngineL)) {
    errors.push(`engineCapacityL ${car.engineCapacityL} is implausible`);
  }
  for (const f of ['doors', 'seats', 'gears', 'horsepower']) {
    if (car[f] != null && (!isInt(car[f]) || car[f] <= 0)) errors.push(`${f} must be a positive integer or null`);
  }

  const vocab = [
    ['fuelType', ALLOWED.fuelType], ['transmission', ALLOWED.transmission], ['drivetrain', ALLOWED.drivetrain],
    ['bodyType', ALLOWED.bodyType], ['exteriorColorFamily', ALLOWED.exteriorColorFamily],
    ['condition', ALLOWED.condition], ['accidentHistory', ALLOWED.accidentHistory],
    ['listingStatus', ALLOWED.listingStatus],
  ];
  for (const [field, allowed] of vocab) {
    if (car[field] != null && !allowed.includes(car[field])) {
      errors.push(`${field} "${car[field]}" is not one of: ${allowed.join(', ')}`);
    }
  }

  if (car.fuelType === 'Electric' && car.engineCapacityL != null) {
    errors.push('an electric vehicle cannot have an engine capacity');
  }
  if (car.fuelEconomy != null) {
    const { min, max, unit } = car.fuelEconomy;
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) errors.push('fuelEconomy needs numeric min <= max');
    if (!['mpg', 'MPGe', 'L/100km', 'km/L', 'kWh/100km'].includes(unit)) errors.push(`fuelEconomy unit "${unit}" is unknown`);
    if (car.fuelType === 'Electric' && unit === 'mpg') warnings.push('electric vehicle economy should be MPGe or kWh/100km');
  }
  if (car.title && car.year && car.make && !car.title.startsWith(`${car.year} ${car.make}`)) {
    warnings.push('title does not start with "<year> <make>"');
  }
  if (isInt(car.year) && isInt(car.mileage)) {
    const age = Math.max(1, currentYear - car.year);
    if (car.mileage / age > 40_000) warnings.push('mileage is very high for the vehicle age');
  }

  if (car.vin != null && !VIN_RE.test(car.vin)) errors.push('vin must be 17 characters (no I, O or Q)');
  if (car.listedAt != null && !ISO_DATE_RE.test(car.listedAt)) errors.push('listedAt must be YYYY-MM-DD');

  if (!Array.isArray(car.images)) {
    errors.push('images must be an array');
  } else {
    if (car.images.length === 0) warnings.push('no images');
    car.images.forEach((img, i) => {
      if (isBlank(img?.src)) errors.push(`images[${i}].src is required`);
      if (isBlank(img?.alt)) errors.push(`images[${i}].alt is required (accessibility)`);
      if (!ALLOWED.imageKind.includes(img?.kind)) errors.push(`images[${i}].kind must be photo or illustration`);
      if (img?.kind === 'photo' && img?.source === 'third-party' && isBlank(img?.credit)) {
        errors.push(`images[${i}] third-party photos need a credit`);
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
