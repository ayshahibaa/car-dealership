import { ApiError } from '../middleware/errorHandler.js';
import type {
  NewVehicleInput,
  Vehicle,
  VehicleFilter,
  VehicleRepository,
  VehicleUpdateInput,
} from './vehicleRepository.js';

export function listVehicles(repo: VehicleRepository, filter?: VehicleFilter): Promise<Vehicle[]> {
  return repo.findAvailable(filter);
}

export function listAllVehicles(repo: VehicleRepository): Promise<Vehicle[]> {
  return repo.findAll();
}

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
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

export async function restockVehicle(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { quantity: 1, listingStatus: 'available' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

export async function approveVehicleListing(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { approvalStatus: 'approved' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}

export async function rejectVehicleListing(repo: VehicleRepository, id: string): Promise<Vehicle> {
  const updated = await repo.update(id, { approvalStatus: 'rejected' });
  if (!updated) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return updated;
}
