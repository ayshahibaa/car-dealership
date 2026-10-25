import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createPurchaseRequestRouter } from '../src/routes/purchaseRequest.router.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { signAccessToken } from '../src/auth/jwt.js';
import type { PurchaseRequest, PurchaseRequestRepository } from '../src/purchaseRequests/purchaseRequestRepository.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/** Same injected-fake-repository-plus-real-auth-middleware pattern as vehicleRouter.test.ts. */
function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: overrides.id ?? 'v1',
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

function buildApp(vehicleSeed: Vehicle[] = [], requestSeed: PurchaseRequest[] = []) {
  const vehicles = [...vehicleSeed];
  const vehicleRepo: VehicleRepository = {
    async findAvailable() {
      return vehicles.filter((v) => v.quantity > 0 && v.approvalStatus === 'approved');
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
      const vehicle: Vehicle = { ...data, id: `vehicle-${vehicles.length + 1}`, stockNumber: `STK-${1000 + vehicles.length}`, quantity: data.quantity ?? 1, listingStatus: 'available', listedById };
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

  const requests = [...requestSeed];
  const requestRepo: PurchaseRequestRepository = {
    async create(vehicleId, buyerId) {
      const req: PurchaseRequest = { id: `request-${requests.length + 1}`, vehicleId, buyerId, status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null };
      requests.push(req);
      return req;
    },
    async findById(id) {
      return requests.find((r) => r.id === id) ?? null;
    },
    async findPendingForBuyerAndVehicle(vehicleId, buyerId) {
      return requests.find((r) => r.vehicleId === vehicleId && r.buyerId === buyerId && r.status === 'PENDING') ?? null;
    },
    async findByBuyer(buyerId) {
      return requests.filter((r) => r.buyerId === buyerId);
    },
    async findPending() {
      return requests.filter((r) => r.status === 'PENDING');
    },
    async decide(id, status, decidedById) {
      const index = requests.findIndex((r) => r.id === id);
      if (index === -1) return null;
      requests[index] = { ...requests[index]!, status, decidedAt: new Date(), decidedById };
      return requests[index]!;
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api/purchase-requests', createPurchaseRequestRouter(requestRepo, vehicleRepo));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const buyerToken = signAccessToken({ userId: 'buyer-1', email: 'buyer@example.com', role: 'USER' });
const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

describe('POST /api/purchase-requests', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const app = buildApp([makeVehicle()]);

    const response = await request(app).post('/api/purchase-requests').send({ vehicleId: 'v1' });

    expect(response.status).toBe(401);
  });

  it('files a pending request and leaves the vehicle untouched', async () => {
    const app = buildApp([makeVehicle({ quantity: 1 })]);

    const response = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ vehicleId: 'v1' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING');
  });

  it('returns 409 when the vehicle is out of stock', async () => {
    const app = buildApp([makeVehicle({ quantity: 0 })]);

    const response = await request(app)
      .post('/api/purchase-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ vehicleId: 'v1' });

    expect(response.status).toBe(409);
  });
});

describe('GET /api/purchase-requests/mine', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(buildApp()).get('/api/purchase-requests/mine');
    expect(response.status).toBe(401);
  });

  it("returns only the caller's own requests", async () => {
    const app = buildApp([makeVehicle()], [
      { id: 'r1', vehicleId: 'v1', buyerId: 'buyer-1', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
      { id: 'r2', vehicleId: 'v1', buyerId: 'someone-else', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
    ]);

    const response = await request(app).get('/api/purchase-requests/mine').set('Authorization', `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.map((r: PurchaseRequest) => r.id)).toEqual(['r1']);
  });
});

describe('GET /api/purchase-requests/pending', () => {
  it('rejects a non-admin user with 403', async () => {
    const response = await request(buildApp()).get('/api/purchase-requests/pending').set('Authorization', `Bearer ${buyerToken}`);
    expect(response.status).toBe(403);
  });

  it('returns the pending queue for an admin', async () => {
    const app = buildApp([makeVehicle()], [
      { id: 'r1', vehicleId: 'v1', buyerId: 'buyer-1', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
    ]);

    const response = await request(app).get('/api/purchase-requests/pending').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});

describe('POST /api/purchase-requests/:id/approve', () => {
  it('rejects a non-admin user with 403', async () => {
    const app = buildApp([makeVehicle()], [
      { id: 'r1', vehicleId: 'v1', buyerId: 'buyer-1', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
    ]);

    const response = await request(app).post('/api/purchase-requests/r1/approve').set('Authorization', `Bearer ${buyerToken}`);

    expect(response.status).toBe(403);
  });

  it('approves the request and decrements the vehicle stock', async () => {
    const app = buildApp([makeVehicle({ quantity: 1 })], [
      { id: 'r1', vehicleId: 'v1', buyerId: 'buyer-1', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
    ]);

    const response = await request(app).post('/api/purchase-requests/r1/approve').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('APPROVED');
  });
});

describe('POST /api/purchase-requests/:id/reject', () => {
  it('rejects the request without touching the vehicle', async () => {
    const app = buildApp([makeVehicle({ quantity: 1 })], [
      { id: 'r1', vehicleId: 'v1', buyerId: 'buyer-1', status: 'PENDING', requestedAt: new Date(), decidedAt: null, decidedById: null },
    ]);

    const response = await request(app).post('/api/purchase-requests/r1/reject').set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('REJECTED');
  });
});
