import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createVehicleRouter } from '../src/routes/vehicle.router.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { signAccessToken } from '../src/auth/jwt.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * Built with an injected VehicleRepository plus the real auth middleware, so
 * this exercises the full HTTP layer (status codes, who's allowed to do
 * what) end to end with no database — same pattern as authRouter.test.ts.
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

describe('GET /api/vehicles', () => {
  it('lists available vehicles with no auth required', async () => {
    const app = buildApp([makeVehicle({ id: 'a', quantity: 1 }), makeVehicle({ id: 'b', quantity: 0 })]);

    const response = await request(app).get('/api/vehicles');

    expect(response.status).toBe(200);
    expect(response.body.map((v: Vehicle) => v.id)).toEqual(['a']);
  });
});

describe('GET /api/vehicles/search', () => {
  it('filters by query params', async () => {
    const app = buildApp([makeVehicle({ id: 'a', make: 'Toyota' }), makeVehicle({ id: 'b', make: 'Honda' })]);

    const response = await request(app).get('/api/vehicles/search').query({ make: 'Toyota' });

    expect(response.status).toBe(200);
    expect(response.body.map((v: Vehicle) => v.id)).toEqual(['a']);
  });
});

describe('POST /api/vehicles', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp();

    const response = await request(app).post('/api/vehicles').send({ title: 'x' });

    expect(response.status).toBe(401);
  });

  it('allows any logged-in user to create a vehicle', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
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
      });

    expect(response.status).toBe(201);
    expect(response.body.listedById).toBe('user-1');
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp([makeVehicle({ id: 'a' })]);

    const response = await request(app).put('/api/vehicles/a').send({ price: 1 });

    expect(response.status).toBe(401);
  });

  it('allows any logged-in user to update a vehicle', async () => {
    const app = buildApp([makeVehicle({ id: 'a', price: 50000 })]);

    const response = await request(app)
      .put('/api/vehicles/a')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 45000 });

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(45000);
  });

  it('returns 404 for a vehicle that does not exist', async () => {
    const app = buildApp();

    const response = await request(app)
      .put('/api/vehicles/missing')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 1 });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('rejects a non-admin user with 403', async () => {
    const app = buildApp([makeVehicle({ id: 'a' })]);

    const response = await request(app)
      .delete('/api/vehicles/a')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp([makeVehicle({ id: 'a' })]);

    const response = await request(app).delete('/api/vehicles/a');

    expect(response.status).toBe(401);
  });

  it('allows an admin to delete a vehicle', async () => {
    const app = buildApp([makeVehicle({ id: 'a' })]);

    const response = await request(app)
      .delete('/api/vehicles/a')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
  });

  it('returns 404 for a vehicle that does not exist', async () => {
    const app = buildApp();

    const response = await request(app)
      .delete('/api/vehicles/missing')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
