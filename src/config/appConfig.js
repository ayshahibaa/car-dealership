/**
 * appConfig.js — every brand and regional setting in one place.
 *
 * The vehicle data itself stays region-neutral: prices are stored in
 * `dataCurrency` and mileage in `dataDistanceUnit` (see src/data/cars.json → meta).
 * What the visitor SEES is controlled here, so the site can be configured for
 * another market without touching components.
 *
 * Examples
 *   Show kilometres:        region.distanceUnit = 'km'
 *   Show euros:             region.currency = 'EUR'; region.exchangeRateFromData = 0.92
 *   British formatting:     region.locale = 'en-GB'
 */
export const appConfig = Object.freeze({
  brand: Object.freeze({
    name: 'Autoza',
    tagline: 'Find your perfect used car with confidence',
    supportEmail: 'hello@autoza.example', // .example domains are reserved for demos
  }),

  region: Object.freeze({
    locale: 'en-US', // number & date formatting
    currency: 'USD', // currency shown to visitors
    dataCurrency: 'USD', // currency the inventory prices are stored in
    // Multiply stored prices by this to get `currency`. Keep 1 while both are the same.
    // A real deployment should get live rates from the backend instead.
    exchangeRateFromData: 1,
    distanceUnit: 'mi', // 'mi' or 'km' shown to visitors
    dataDistanceUnit: 'mi', // unit the inventory mileage is stored in
  }),

  inventory: Object.freeze({
    pageSize: 12,
    defaultSort: 'recent',
  }),

  api: Object.freeze({
    // The real backend (Phases B1-B5): auth, listing your own car, editing/
    // deleting a listing, buying, admin restock. Browsing the catalog above
    // still reads the local demo dataset — see carService.js's file comment.
    // Override with a .env file (VITE_API_BASE_URL=https://your-api.example/api)
    // when the backend isn't running on localhost:4000.
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  }),

  demo: Object.freeze({
    // The local data source waits this long so loading states are visible,
    // just as they would be with a real network request.
    simulatedLatencyMs: 250,
    // Labels shown so nobody mistakes demo content for real listings.
    illustrationLabel: 'Illustrative image',
  }),
});
