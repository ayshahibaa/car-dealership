import { appConfig } from '../config/appConfig.js';

const formatterCache = new Map();

function getFormatter(locale, currency) {
  const key = `${locale}|${currency}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }),
    );
  }
  return formatterCache.get(key);
}

export function convertPrice(amount, { exchangeRateFromData = appConfig.region.exchangeRateFromData } = {}) {
  return typeof amount === 'number' ? amount * exchangeRateFromData : null;
}

export function formatCurrency(
  amount,
  { locale = appConfig.region.locale, currency = appConfig.region.currency, fallback = 'Price on request' } = {},
) {
  const value = convertPrice(amount);
  if (value === null || Number.isNaN(value)) return fallback;
  return getFormatter(locale, currency).format(value);
}
