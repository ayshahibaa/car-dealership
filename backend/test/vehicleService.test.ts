import { describe, expect, it } from 'vitest';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from '../src/vehicles/vehicleService.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * vehicleService depends only on the narrow VehicleRepository interface, so
 * it's fully testable with a plain in-memory fake — same pattern as
 * authService.test.ts. The actual business rules (what counts as
 * "available", search filtering, who a listing belongs to) get real
 * coverage here even though this sandbox can't run the Prisma-backed
 * version live.
 */
function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: overrides.id ?? `vehicle-${Math.random().toString(36).slice(2)}`,
    stockNumber: overrides.stockNumber ?? 'STK-0001',
    title: overrides.title ?? '2020 Toyota Camry',
    make: overrides.make ?? 'Toyota',
    model: overrides.model ?? 'Camry',
    variant: overrides.variant ?? null,
    year: overrides.year ?? 2020,
    price: overrides.price ?? 50000,
    quantity: overrides.quantity ?? 1,
    mileage: overrides.mileage ?? 10000,
    bodyType: overrides.bodyType ?? 'Sedan',
    condition: overrides.condition ?? 'Used',
    fuelType: overrides.fuelType ?? 'Petrol',
    transmission: overrides.transmission ?? 'Automatic',
    images: overrides.images ?? [],
    listingStatus: overrides.listingStatus ?? 'available',
    listedById: overrides.listedById ?? null,
  };
}

function createFakeRepo(seed: Vehicle[] = []): VehicleRepository {
  const vehicles = [...seed];
  return {
    async findAvailable(filter) {
      let results = vehicles.filter((v) => v.quantity > 0);
      if (filter?.make) {
        results = results.filter((v) => v.make.toLowerCase() === filter.make!.toLowerCase());
      }
      if (filter?.model) {
        results = results.filter((v) => v.model.toLowerCase() === filter.model!.toLowerCase());
      }
      if (filter?.category) {
        results = results.filter((v) => v.bodyType.toLowerCase() === filter.category!.toLowerCase());
      }
      if (filter?.minPrice !== undefined) {
        results = results.filter((v) => v.price >= filter.minPrice!);
      }
      if (filter?.maxPrice !== undefined) {
        results = results.filter((v) => v.price <= filter.maxPrice!);
      }
      return results;
    },
    async findAll() {
      return vehicles;
    },
    async findPending() {
      return vehicles.filter((v) => v.approvalStatus === 'pending');
    },
    async findById(id) {
      return vehicles.find((v) => v.id === id) ?? null;
    },
    async create(data, listedById) {
      const vehicle: Vehicle = {
        ...data,
        id: `vehicle-${vehicles.length + 1}`,
        stockNumber: `STK-${1000 + vehicles.length}`,
        quantity: data.quantity ?? 1,
        listingStatus: 'available',
        listedById,
      };
      vehicles.push(vehicle);
      return vehicle;
    },
    async update(id, data) {
      const index = vehicles.findIndex((v) => v.id === id);
      if (index === -1) return null;
      vehicles[index] = { ...vehicles[index]!, ...data };
      return vehicles[index]!;
    },
    async remove(id) {
      const index = vehicles.findIndex((v) => v.id === id);
      if (index === -1) return false;
      vehicles.splice(index, 1);
      return true;
    },
  };
}

describe('listVehicles', () => {
  it('returns only vehicles with quantity > 0 by default', async () => {
    const repo = createFakeRepo([
      makeVehicle({ id: 'a', quantity: 1 }),
      makeVehicle({ id: 'b', quantity: 0 }),
    ]);

    const result = await listVehicles(repo);

    expect(result.map((v) => v.id)).toEqual(['a']);
  });

  it('filters by make, model, category and price range for search', async () => {
    const repo = createFakeRepo([
      makeVehicle({ id: 'a', make: 'Toyota', model: 'Camry', bodyType: 'Sedan', price: 50000 }),
      makeVehicle({ id: 'b', make: 'Honda', model: 'Civic', bodyType: 'Sedan', price: 40000 }),
      makeVehicle({ id: 'c', make: 'Toyota', model: 'Hilux', bodyType: 'Truck', price: 90000 }),
    ]);

    const byMake = await listVehicles(repo, { make: 'Toyota' });
    expect(byMake.map((v) => v.id).sort()).toEqual(['a', 'c']);

    const byModel = await listVehicles(repo, { model: 'Civic' });
    expect(byModel.map((v) => v.id)).toEqual(['b']);

    const byCategory = await listVehicles(repo, { category: 'Truck' });
    expect(byCategory.map((v) => v.id)).toEqual(['c']);

    const byPriceRange = await listVehicles(repo, { minPrice: 45000, maxPrice: 60000 });
    expect(byPriceRange.map((v) => v.id)).toEqual(['a']);
  });
});

describe('createVehicle', () => {
  it('creates a vehicle owned by the given user, defaulting quantity to 1', async () => {
    const repo = createFakeRepo();

    const vehicle = await createVehicle(repo, {
      title: '2021 Nissan Altima',
      make: 'Nissan',
      model: 'Altima',
      variant: null,
      year: 2021,
      price: 60000,
      mileage: 5000,
      bodyType: 'Sedan',
      condition: 'Used',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      images: [],
    }, 'user-1');

    expect(vehicle.listedById).toBe('user-1');
    expect(vehicle.quantity).toBe(1);
    expect(vehicle.listingStatus).toBe('available');
  });
});

describe('updateVehicle', () => {
  it('updates an existing vehicle', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', price: 50000 })]);

    const updated = await updateVehicle(repo, 'a', { price: 48000 });

    expect(updated?.price).toBe(48000);
  });

  it('throws a 404-style error when the vehicle does not exist', async () => {
    const repo = createFakeRepo();

    await expect(updateVehicle(repo, 'missing', { price: 1 })).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteVehicle', () => {
  it('removes an existing vehicle', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a' })]);

    await deleteVehicle(repo, 'a');

    expect(await repo.findById('a')).toBeNull();
  });

  it('throws a 404-style error when the vehicle does not exist', async () => {
    const repo = createFakeRepo();

    await expect(deleteVehicle(repo, 'missing')).rejects.toMatchObject({ status: 404 });
  });
});
