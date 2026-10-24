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
