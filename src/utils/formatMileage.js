import { appConfig } from '../config/appConfig.js';

const KM_PER_MILE = 1.609344;

/** Converts a stored distance into the display unit. */
export function convertDistance(
  value,
  { from = appConfig.region.dataDistanceUnit, to = appConfig.region.distanceUnit } = {},
) {
  if (typeof value !== 'number') return null;
  if (from === to) return value;
  return from === 'mi' ? value * KM_PER_MILE : value / KM_PER_MILE;
}

/**
 * formatMileage(32000) -> "32,000 mi" (or "51,499 km" when distanceUnit is 'km').
 */
export function formatMileage(
  value,
  { locale = appConfig.region.locale, unit = appConfig.region.distanceUnit, fallback = 'Mileage not specified' } = {},
) {
  const converted = convertDistance(value, { to: unit });
  if (converted === null) return fallback;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(converted)} ${unit}`;
}
