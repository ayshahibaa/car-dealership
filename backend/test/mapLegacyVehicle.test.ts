import { describe, expect, it } from 'vitest';
import { mapLegacyVehicle } from '../src/data/mapLegacyVehicle.js';

/**
 * The frontend's existing src/data/cars.json is the only inventory data we
 * have — 686 real cleaned used-car records. Migrating to Postgres means
 * turning each legacy record into Prisma's Vehicle input shape without
 * inventing or dropping any fact. This is a pure function (no DB, no
 * Prisma Client) so it's the fastest, cheapest thing to get fully
 * test-driven before touching the database at all.
 */
const legacyCar = {
  id: 'f966ff62-2b38-48fe-ad2c-211d9680a019',
  stockNumber: 'CAR-0001',
  title: '2022 Lexus IS 500 F SPORT Performance',
  make: 'Lexus',
  model: 'IS',
  variant: '500 F SPORT Performance',
  year: 2022,
  price: 56888,
  mileage: 11633,
  fuelType: 'Petrol',
  transmission: 'Automatic',
  transmissionDetail: '8-Speed Automatic',
  gears: 8,
  drivetrain: 'RWD',
  bodyType: 'Sedan',
  engine: '5.0L V8 32V PDI DOHC',
  engineCapacityL: 5,
  horsepower: null,
  exteriorColor: 'Gray',
  exteriorColorFamily: 'Gray',
  interiorColor: 'Black',
  doors: null,
  seats: null,
  condition: 'Used',
  accidentHistory: 'none-reported',
  fuelEconomy: { min: 17, max: 25, unit: 'mpg' },
  vin: null,
  sellerId: 'SELLER-001',
  description: '2022 Lexus IS 500 F SPORT Performance. Finished in Gray with a Black interior.',
  descriptionSource: 'generated-from-record',
  images: [
    {
      src: '/images/cars/illustrations/sedan-gray.svg',
      alt: 'Illustration of a sedan in Gray',
      kind: 'illustration',
      credit: null,
    },
  ],
  listingStatus: 'available',
  listedAt: '2026-10-01',
  dataFlags: [],
  sourceRow: 2,
};

describe('mapLegacyVehicle', () => {
  it('carries every legacy field over under the same name', () => {
    const result = mapLegacyVehicle(legacyCar);

    expect(result.id).toBe(legacyCar.id);
    expect(result.stockNumber).toBe('CAR-0001');
    expect(result.title).toBe(legacyCar.title);
    expect(result.make).toBe('Lexus');
    expect(result.model).toBe('IS');
    expect(result.variant).toBe('500 F SPORT Performance');
    expect(result.year).toBe(2022);
    expect(result.price).toBe(56888);
    expect(result.mileage).toBe(11633);
    expect(result.bodyType).toBe('Sedan');
    expect(result.condition).toBe('Used');
    expect(result.fuelEconomy).toEqual({ min: 17, max: 25, unit: 'mpg' });
    expect(result.images).toEqual(legacyCar.images);
    expect(result.dataFlags).toEqual([]);
    expect(result.sourceRow).toBe(2);
  });

  it('defaults quantity to 1 for a normally-listed car (quantity does not exist in the legacy data)', () => {
    const result = mapLegacyVehicle(legacyCar);

    expect(result.quantity).toBe(1);
  });

  it('sets quantity to 0 for a car whose legacy listingStatus was already "sold"', () => {
    const soldCar = { ...legacyCar, listingStatus: 'sold' };

    const result = mapLegacyVehicle(soldCar);

    expect(result.quantity).toBe(0);
    expect(result.listingStatus).toBe('sold');
  });

  it('converts the demo-only listedAt date string into a real Date', () => {
    const result = mapLegacyVehicle(legacyCar);

    expect(result.listedAt).toBeInstanceOf(Date);
    expect(result.listedAt?.toISOString().slice(0, 10)).toBe('2026-10-01');
  });

  it('leaves listedAt null when the legacy record has none', () => {
    const noDate = { ...legacyCar, listedAt: null };

    const result = mapLegacyVehicle(noDate);

    expect(result.listedAt).toBeNull();
  });

  it('never sets listedById — the seeded legacy dataset has no real account behind it', () => {
    const result = mapLegacyVehicle(legacyCar);

    expect(result.listedById).toBeNull();
  });
});
