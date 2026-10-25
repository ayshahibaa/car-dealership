import { describe, expect, it } from 'vitest';
import {
  approvePurchaseRequest,
  createPurchaseRequest,
  listMyPurchaseRequests,
  listPendingPurchaseRequests,
  rejectPurchaseRequest,
} from '../src/purchaseRequests/purchaseRequestService.js';
import type { PurchaseRequest, PurchaseRequestRepository } from '../src/purchaseRequests/purchaseRequestRepository.js';
import type { Vehicle, VehicleRepository } from '../src/vehicles/vehicleRepository.js';

/**
 * Same DI-against-a-fake-repository pattern as vehicleService.test.ts.
 * Covers the rule that matters most here: buying a car only ever files a
 * PENDING request — the vehicle's stock is untouched until approvePurchase-
 * Request runs, and only then does it behave like the old instant purchase.
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

function createFakeVehicleRepo(seed: Vehicle[] = []): VehicleRepository {
  const vehicles = [...seed];
  return {
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
}

function createFakeRequestRepo(seed: PurchaseRequest[] = []): PurchaseRequestRepository {
  const requests = [...seed];
  return {
    async create(vehicleId, buyerId) {
      const request: PurchaseRequest = {
        id: `request-${requests.length + 1}`,
        vehicleId,
        buyerId,
        status: 'PENDING',
        requestedAt: new Date(),
        decidedAt: null,
        decidedById: null,
      };
      requests.push(request);
      return request;
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
}

describe('createPurchaseRequest', () => {
  it('files a PENDING request without touching the vehicle stock', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', quantity: 1 })]);
    const repo = createFakeRequestRepo();

    const request = await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');

    expect(request.status).toBe('PENDING');
    expect((await vehicleRepo.findById('v1'))?.quantity).toBe(1);
  });

  it('rejects with 404 when the vehicle does not exist or is not approved', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', approvalStatus: 'pending' })]);
    const repo = createFakeRequestRepo();

    await expect(createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1')).rejects.toMatchObject({ status: 404 });
    await expect(createPurchaseRequest(repo, vehicleRepo, 'missing', 'buyer-1')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects with 409 when the vehicle is out of stock', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', quantity: 0 })]);
    const repo = createFakeRequestRepo();

    await expect(createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1')).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a seller requesting to buy their own listing', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', listedById: 'seller-1' })]);
    const repo = createFakeRequestRepo();

    await expect(createPurchaseRequest(repo, vehicleRepo, 'v1', 'seller-1')).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a second pending request from the same buyer for the same vehicle', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1' })]);
    const repo = createFakeRequestRepo();
    await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');

    await expect(createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1')).rejects.toMatchObject({ status: 409 });
  });
});

describe('approvePurchaseRequest', () => {
  it('decrements the vehicle stock and marks the request APPROVED', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', quantity: 1 })]);
    const repo = createFakeRequestRepo();
    const request = await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');

    const result = await approvePurchaseRequest(repo, vehicleRepo, request.id, 'admin-1');

    expect(result.status).toBe('APPROVED');
    expect(result.decidedById).toBe('admin-1');
    expect((await vehicleRepo.findById('v1'))?.quantity).toBe(0);
    expect((await vehicleRepo.findById('v1'))?.listingStatus).toBe('sold');
  });

  it('rejects approving a request that was already decided', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', quantity: 1 })]);
    const repo = createFakeRequestRepo();
    const request = await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');
    await approvePurchaseRequest(repo, vehicleRepo, request.id, 'admin-1');

    await expect(approvePurchaseRequest(repo, vehicleRepo, request.id, 'admin-1')).rejects.toMatchObject({ status: 409 });
  });

  it('throws a 404-style error when the request does not exist', async () => {
    const vehicleRepo = createFakeVehicleRepo();
    const repo = createFakeRequestRepo();

    await expect(approvePurchaseRequest(repo, vehicleRepo, 'missing', 'admin-1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('rejectPurchaseRequest', () => {
  it('marks the request REJECTED and leaves the vehicle stock untouched', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1', quantity: 1 })]);
    const repo = createFakeRequestRepo();
    const request = await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');

    const result = await rejectPurchaseRequest(repo, request.id, 'admin-1');

    expect(result.status).toBe('REJECTED');
    expect((await vehicleRepo.findById('v1'))?.quantity).toBe(1);
  });
});

describe('listMyPurchaseRequests / listPendingPurchaseRequests', () => {
  it('filters to the right buyer and to pending-only respectively', async () => {
    const vehicleRepo = createFakeVehicleRepo([makeVehicle({ id: 'v1' }), makeVehicle({ id: 'v2' })]);
    const repo = createFakeRequestRepo();
    await createPurchaseRequest(repo, vehicleRepo, 'v1', 'buyer-1');
    const forBuyer2 = await createPurchaseRequest(repo, vehicleRepo, 'v2', 'buyer-2');
    await rejectPurchaseRequest(repo, forBuyer2.id, 'admin-1');

    expect((await listMyPurchaseRequests(repo, 'buyer-1')).map((r) => r.vehicleId)).toEqual(['v1']);
    expect(await listPendingPurchaseRequests(repo)).toHaveLength(1);
  });
});
