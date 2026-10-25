import { ApiError } from '../middleware/errorHandler.js';
import { decrementVehicleStock } from '../vehicles/vehicleService.js';
import type { VehicleRepository } from '../vehicles/vehicleRepository.js';
import type { PurchaseRequest, PurchaseRequestRepository } from './purchaseRequestRepository.js';

/**
 * Business rules for the buy flow: buying a car no longer completes a sale
 * on its own, it files a request an admin has to approve (see the
 * PurchaseRequest doc comment in schema.prisma for why). Depends only on
 * the narrow repository interfaces, same DI-for-testing pattern as
 * vehicleService.ts.
 */

/**
 * Any logged-in user may request to buy an available vehicle (enforced by
 * requireAuth at the router layer). Rejects with 404 if the vehicle doesn't
 * exist or isn't publicly listed yet, 409 if it's out of stock, if the
 * buyer is the one who listed it, or if they already have a pending
 * request for it.
 */
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

/** A buyer's own purchase requests (pending, approved and rejected) — GET /api/purchase-requests/mine. */
export function listMyPurchaseRequests(repo: PurchaseRequestRepository, buyerId: string): Promise<PurchaseRequest[]> {
  return repo.findByBuyer(buyerId);
}

/** Admin-only: the review queue — GET /api/purchase-requests/pending. */
export function listPendingPurchaseRequests(repo: PurchaseRequestRepository): Promise<PurchaseRequest[]> {
  return repo.findPending();
}

/**
 * Admin-only: approving is what actually completes the sale — decrements
 * the vehicle's stock (marking it sold if that was the last one), then
 * marks the request APPROVED. If the vehicle sold out from under this
 * request (another one was approved first), the stock decrement itself
 * rejects with 409 and the request is left PENDING for the admin to
 * re-decide.
 */
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

/** Admin-only: rejects a pending request. The vehicle's stock is untouched. */
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
