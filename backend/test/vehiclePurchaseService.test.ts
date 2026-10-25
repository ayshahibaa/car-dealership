import { describe, expect, it } from 'vitest';
import { decrementVehicleStock, restockVehicle } from '../src/vehicles/vehicleService.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * Stock-mutation business rules, same DI-against-a-fake-repository pattern
 * as the rest of vehicleService.ts. decrementVehicleStock isn't reachable
 * directly from the router any more — it's what approving a PurchaseRequest
 * does under the hood (see purchaseRequests/purchaseRequestService.test.ts)
 * — but the rule itself ("decrement by 1, mark sold at 0, reject at 0") is
 * still exactly as testable here as it was when it was called "purchase".
 */
function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: overrides.id ?? 'vehicle-1',
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
      if (filter?.make) results = results.filter((v) => v.make === filter.make);
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

describe('decrementVehicleStock', () => {
  it('decrements quantity by 1 and marks the vehicle sold when it reaches 0', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', quantity: 1 })]);

    const result = await decrementVehicleStock(repo, 'a');

    expect(result.quantity).toBe(0);
    expect(result.listingStatus).toBe('sold');
  });

  it('decrements quantity without marking sold when stock remains', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', quantity: 3 })]);

    const result = await decrementVehicleStock(repo, 'a');

    expect(result.quantity).toBe(2);
    expect(result.listingStatus).toBe('available');
  });

  it('rejects decrementing a vehicle that is already out of stock', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', quantity: 0 })]);

    await expect(decrementVehicleStock(repo, 'a')).rejects.toMatchObject({ status: 409 });
  });

  it('throws a 404-style error when the vehicle does not exist', async () => {
    const repo = createFakeRepo();

    await expect(decrementVehicleStock(repo, 'missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('restockVehicle', () => {
  it('resets quantity to 1 and marks the vehicle available again', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', quantity: 0, listingStatus: 'sold' })]);

    const result = await restockVehicle(repo, 'a');

    expect(result.quantity).toBe(1);
    expect(result.listingStatus).toBe('available');
  });

  it('throws a 404-style error when the vehicle does not exist', async () => {
    const repo = createFakeRepo();

    await expect(restockVehicle(repo, 'missing')).rejects.toMatchObject({ status: 404 });
  });
});
