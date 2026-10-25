import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createVehicleRouter } from '../src/routes/vehicle.router.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { signAccessToken } from '../src/auth/jwt.js';
import { listAllVehicles } from '../src/vehicles/vehicleService.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * The admin dashboard needs to see out-of-stock (quantity 0 / "sold")
 * vehicles too, so it can restock them — the public listing endpoints
 * (GET /vehicles, /vehicles/search) deliberately hide those. This adds an
 * admin-only "everything" listing, same DI-against-a-fake-repository
 * pattern as the rest of the vehicles slice.
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

describe('listAllVehicles (service)', () => {
  it('returns vehicles regardless of quantity, unlike listVehicles', async () => {
    const repo = createFakeRepo([makeVehicle({ id: 'a', quantity: 1 }), makeVehicle({ id: 'b', quantity: 0 })]);

    const result = await listAllVehicles(repo);

    expect(result.map((v) => v.id).sort()).toEqual(['a', 'b']);
  });
});

describe('GET /api/vehicles/admin/all', () => {
  function buildApp(seed: Vehicle[] = []) {
    const repo = createFakeRepo(seed);
    const app = express();
    app.use(express.json());
    app.use('/api/vehicles', createVehicleRouter(repo));
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
  }

  const userToken = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'USER' });
  const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(buildApp()).get('/api/vehicles/admin/all');
    expect(response.status).toBe(401);
  });

  it('rejects a non-admin user with 403', async () => {
    const response = await request(buildApp()).get('/api/vehicles/admin/all').set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('returns every vehicle, including out-of-stock ones, for an admin', async () => {
    const app = buildApp([makeVehicle({ id: 'a', quantity: 1 }), makeVehicle({ id: 'b', quantity: 0, listingStatus: 'sold' })]);

    const response = await request(app).get('/api/vehicles/admin/all').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.map((v: Vehicle) => v.id).sort()).toEqual(['a', 'b']);
  });
});
