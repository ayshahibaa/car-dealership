import { prisma } from '../db/prismaClient.js';
import type { NewVehicleInput, Vehicle, VehicleFilter, VehicleRepository, VehicleUpdateInput } from './vehicleRepository.js';

/**
 * The real VehicleRepository, backed by Postgres via Prisma. Everything that
 * matters about *how* vehicle rules behave lives in vehicleService.ts and is
 * tested against a fake repository — this file is intentionally a thin,
 * low-risk pass-through, same approach as prismaUserRepository.ts.
 */

function buildWhere(filter?: VehicleFilter) {
  const where: Record<string, unknown> = { quantity: { gt: 0 } };
  if (filter?.make) where.make = { equals: filter.make, mode: 'insensitive' };
  if (filter?.model) where.model = { equals: filter.model, mode: 'insensitive' };
  if (filter?.category) where.bodyType = { equals: filter.category, mode: 'insensitive' };
  if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
    where.price = {
      ...(filter?.minPrice !== undefined ? { gte: filter.minPrice } : {}),
      ...(filter?.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
    };
  }
  return where;
}

export const prismaVehicleRepository: VehicleRepository = {
  async findAvailable(filter) {
    return prisma.vehicle.findMany({ where: buildWhere(filter) }) as unknown as Vehicle[];
  },
  async findById(id) {
    return prisma.vehicle.findUnique({ where: { id } }) as unknown as Vehicle | null;
  },
  async create(data: NewVehicleInput, listedById: string) {
    return prisma.vehicle.create({
      data: {
        ...data,
        // Seeded cars get "STK-####" from the data migration; user-listed
        // cars (via the "sell your car" flow or the API directly) get a
        // distinct, still-unique prefix so the two series never collide.
        stockNumber: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        quantity: data.quantity ?? 1,
        listingStatus: 'available',
        listedById,
      },
    }) as unknown as Vehicle;
  },
  async update(id, data: VehicleUpdateInput) {
    try {
      return (await prisma.vehicle.update({ where: { id }, data })) as unknown as Vehicle;
    } catch {
      return null;
    }
  },
  async remove(id) {
    try {
      await prisma.vehicle.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
