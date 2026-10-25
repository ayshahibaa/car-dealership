import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createVehicleRouter } from '../src/routes/vehicle.router.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { signAccessToken } from '../src/auth/jwt.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * Same pattern as vehicleRouter.test.ts: injected fake repository plus the
 * real auth middleware, exercised end to end with Supertest. Buying used to
 * have its own route here (POST /:id/purchase, instant) — it's now
 * POST /api/purchase-requests (see purchaseRequestRouter.test.ts), which
 * only files a request for an admin to approve.
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
    approvalStatus: overrides.approvalStatus ?? 'approved',
  };
}

function buildApp(seed: Vehicle[] = []) {
  const vehicles = [...seed];
  const repo: VehicleRepository = {
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

  const app = express();
  app.use(express.json());
  app.use('/api/vehicles', createVehicleRouter(repo));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const userToken = signAccessToken({ userId: 'user-1', email: 'user@example.com', role: 'USER' });
const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

describe('POST /api/vehicles/:id/restock', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp([makeVehicle({ id: 'a', quantity: 0 })]);

    const response = await request(app).post('/api/vehicles/a/restock');

    expect(response.status).toBe(401);
  });

  it('rejects a non-admin user with 403', async () => {
    const app = buildApp([makeVehicle({ id: 'a', quantity: 0 })]);

    const response = await request(app)
      .post('/api/vehicles/a/restock')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it('allows an admin to restock a vehicle', async () => {
    const app = buildApp([makeVehicle({ id: 'a', quantity: 0, listingStatus: 'sold' })]);

    const response = await request(app)
      .post('/api/vehicles/a/restock')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(1);
    expect(response.body.listingStatus).toBe('available');
  });

  it('returns 404 for a vehicle that does not exist', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/vehicles/missing/restock')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/vehicles/:id/approve and /reject', () => {
  it('rejects a non-admin user with 403', async () => {
    const app = buildApp([makeVehicle({ id: 'a', approvalStatus: 'pending' })]);

    const response = await request(app)
      .post('/api/vehicles/a/approve')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it('allows an admin to approve a pending listing', async () => {
    const app = buildApp([makeVehicle({ id: 'a', approvalStatus: 'pending' })]);

    const response = await request(app)
      .post('/api/vehicles/a/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.approvalStatus).toBe('approved');
  });

  it('allows an admin to reject a pending listing', async () => {
    const app = buildApp([makeVehicle({ id: 'a', approvalStatus: 'pending' })]);

    const response = await request(app)
      .post('/api/vehicles/a/reject')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.approvalStatus).toBe('rejected');
  });
});

describe('GET /api/vehicles/admin/pending', () => {
  it('returns only pending listings for an admin', async () => {
    const app = buildApp([
      makeVehicle({ id: 'a', approvalStatus: 'pending' }),
      makeVehicle({ id: 'b', approvalStatus: 'approved' }),
    ]);

    const response = await request(app)
      .get('/api/vehicles/admin/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.map((v: Vehicle) => v.id)).toEqual(['a']);
  });
});

describe('PUT /api/vehicles/:id', () => {
  it("ignores a client-supplied approvalStatus — can't self-approve through the edit endpoint", async () => {
    const app = buildApp([makeVehicle({ id: 'a', approvalStatus: 'pending' })]);

    const response = await request(app)
      .put('/api/vehicles/a')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ approvalStatus: 'approved', quantity: 99 });

    expect(response.status).toBe(200);
    expect(response.body.approvalStatus).toBe('pending');
    expect(response.body.quantity).toBe(1);
  });
});
