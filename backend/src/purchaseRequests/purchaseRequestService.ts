import { ApiError } from '../middleware/errorHandler.js';
import { decrementVehicleStock } from '../vehicles/vehicleService.js';
import type { VehicleRepository } from '../vehicles/vehicleRepository.js';
import type { PurchaseRequest, PurchaseRequestRepository } from './purchaseRequestRepository.js';

export async function createPurchaseRequest(
  repo: PurchaseRequestRepository,
  vehicleRepo: VehicleRepository,
  vehicleId: string,
  buyerId: string,
): Promise<PurchaseRequest> {
  const vehicle = await vehicleRepo.findById(vehicleId);
  if (!vehicle || vehicle.approvalStatus !== 'approved') {
    throw new ApiError(404, 'Vehicle not found');
  }
  if (vehicle.quantity <= 0) {
    throw new ApiError(409, 'Vehicle is out of stock');
  }
  if (vehicle.listedById === buyerId) {
    throw new ApiError(409, 'You cannot request to buy your own listing');
  }

  const existing = await repo.findPendingForBuyerAndVehicle(vehicleId, buyerId);
  if (existing) {
    throw new ApiError(409, 'You already have a pending request for this vehicle');
  }

  return repo.create(vehicleId, buyerId);
}

export function listMyPurchaseRequests(repo: PurchaseRequestRepository, buyerId: string): Promise<PurchaseRequest[]> {
  return repo.findByBuyer(buyerId);
}

export function listPendingPurchaseRequests(repo: PurchaseRequestRepository): Promise<PurchaseRequest[]> {
  return repo.findPending();
}

export async function approvePurchaseRequest(
  repo: PurchaseRequestRepository,
  vehicleRepo: VehicleRepository,
  id: string,
  adminId: string,
): Promise<PurchaseRequest> {
  const request = await repo.findById(id);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(409, 'This request has already been decided');
  }

  await decrementVehicleStock(vehicleRepo, request.vehicleId);

  const updated = await repo.decide(id, 'APPROVED', adminId);
  if (!updated) {
    throw new ApiError(404, 'Purchase request not found');
  }
  return updated;
}

export async function rejectPurchaseRequest(
  repo: PurchaseRequestRepository,
  id: string,
  adminId: string,
): Promise<PurchaseRequest> {
  const request = await repo.findById(id);
  if (!request) {
    throw new ApiError(404, 'Purchase request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(409, 'This request has already been decided');
  }

  const updated = await repo.decide(id, 'REJECTED', adminId);
  if (!updated) {
    throw new ApiError(404, 'Purchase request not found');
  }
  return updated;
}
