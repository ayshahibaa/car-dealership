import { ApiError } from '../middleware/errorHandler.js';
import type {
  NewVehicleInput,
  Vehicle,
  VehicleFilter,
  VehicleRepository,
  VehicleUpdateInput,
} from './vehicleRepository.js';

/**
 * Business rules for vehicles, depending only on the narrow VehicleRepository
 * interface so they're testable against an in-memory fake — same pattern as
 * authService.ts. Who is *allowed* to call these (auth, admin-only delete)
 * is enforced by middleware at the router layer, not here.
 */

/** No filter = GET /vehicles (every available listing); a filter = search. */
export function listVehicles(repo: VehicleRepository, filter?: VehicleFilter): Promise<Vehicle[]> {
  return repo.findAvailable(filter);
}

/** Admin-only (enforced at the router layer): every vehicle, including out-of-stock ones, so they can be restocked. */
export function listAllVehicles(repo: VehicleRepository): Promise<Vehicle[]> {
  return repo.findAll();
}

/** Admin-only (enforced at the router layer): listings awaiting moderation. */
export function listPendingVehicles(repo: VehicleRepository): Promise<Vehicle[]> {
  return repo.findPending();
}

export function getVehicle(repo: VehicleRepository, id: string): Promise<Vehicle | null> {
  return repo.findById(id);
}

export function createVehicle(
  repo: VehicleRepository,
  data: NewVehicleInput,
  listedById: string,
): Promise<Vehicle> {
  return repo.create(data, listedById);
}

export async function updateVehicle(
  repo: VehicleRepository,
  id: string,
  data: VehicleUpdateInput,
): Promise<Vehicle | null> {
  const updated = await repo.update(id, data);
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

export async function deleteVehicle(repo: VehicleRepository, id: string): Promise<void> {
  const removed = await repo.remove(id);
  if (!removed) {
    throw new ApiError(404, 'Vehicle not found');
  }
}

/**
 * Decrements quantity by 1; once it hits 0 the listing is marked sold.
 * Rejects with 409 if there's no stock left. This no longer runs off a
 * direct buyer action — it's the effect of an admin approving a
 * PurchaseRequest (see purchaseRequests/purchaseRequestService.ts), which
 * is the only caller. Buying a car used to call this directly and complete
 * instantly; it's now a two-step request/approval flow so a sale can't
 * happen without an admin signing off on it.
 */
export async function decrementVehicleStock(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const vehicle = await repo.findById(id);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  if (vehicle.quantity <= 0) {
    throw new ApiError(409, 'Vehicle is out of stock');
  }

  const quantity = vehicle.quantity - 1;
  const updated = await repo.update(id, {
    quantity,
    listingStatus: quantity === 0 ? 'sold' : vehicle.listingStatus,
  });
  // repo.update can only return null if the row vanished between the two
  // calls above — vanishingly unlikely, but still not a case to paper over.
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

/** Admin-only (enforced by requireAuth + requireAdmin at the router layer). Resets quantity to 1 and re-lists the vehicle. */
export async function restockVehicle(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { quantity: 1, listingStatus: 'available' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

/** Admin-only: approves a pending listing so it starts showing up in public listings. */
export async function approveVehicleListing(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { approvalStatus: 'approved' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

/** Admin-only: rejects a pending listing. It stays in the database but never becomes publicly visible. */
export async function rejectVehicleListing(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { approvalStatus: 'rejected' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}
