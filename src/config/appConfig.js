export const appConfig = Object.freeze({
  brand: Object.freeze({
    name: 'Autoza',
    tagline: 'Find your perfect used car with confidence',
    supportEmail: 'hello@autoza.example',
  }),

  region: Object.freeze({
    locale: 'en-US',
    currency: 'USD',
    dataCurrency: 'USD',
    exchangeRateFromData: 1,
    distanceUnit: 'mi',
    dataDistanceUnit: 'mi',
  }),

  inventory: Object.freeze({
    pageSize: 12,
    defaultSort: 'recent',
  }),

  api: Object.freeze({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  }),

  demo: Object.freeze({
    simulatedLatencyMs: 250,
    illustrationLabel: 'Illustrative image',
  }),
});
