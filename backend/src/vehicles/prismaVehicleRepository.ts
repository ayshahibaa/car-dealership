import { Prisma } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';
import type { NewVehicleInput, Vehicle, VehicleFilter, VehicleRepository, VehicleUpdateInput } from './vehicleRepository.js';

/**
 * The real VehicleRepository, backed by Postgres via Prisma. Everything that
 * matters about *how* vehicle rules behave lives in vehicleService.ts and is
 * tested against a fake repository — this file is intentionally a thin,
 * low-risk pass-through, same approach as prismaUserRepository.ts.
 */

/**
 * Prisma's Json columns treat a bare JS `null` as ambiguous — at runtime it
 * must be `Prisma.JsonNull` to mean "set this column to SQL NULL" (plain
 * `null` only means "field not provided", same as `undefined`, for every
 * other column type).
 */
function toJsonInput(value: unknown) {
  return value === null ? Prisma.JsonNull : value;
}

function buildWhere(filter?: VehicleFilter) {
  const where: Record<string, unknown> = { quantity: { gt: 0 }, approvalStatus: 'approved' };
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
  async findAll() {
    return prisma.vehicle.findMany() as unknown as Vehicle[];
  },
  async findPending() {
    return prisma.vehicle.findMany({ where: { approvalStatus: 'pending' } }) as unknown as Vehicle[];
  },
  async findById(id) {
    return prisma.vehicle.findUnique({ where: { id } }) as unknown as Vehicle | null;
  },
  async create(data: NewVehicleInput, listedById: string) {
    return prisma.vehicle.create({
      data: {
        ...data,
        fuelEconomy: toJsonInput(data.fuelEconomy),
        images: toJsonInput(data.images),
        // Seeded cars get "STK-####" from the data migration; user-listed
        // cars (via the "sell your car" flow or the API directly) get a
        // distinct, still-unique prefix so the two series never collide.
        stockNumber: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        quantity: data.quantity ?? 1,
        listingStatus: 'available',
        listedById,
        // Never trust approvalStatus from `data` even though NewVehicleInput
        // already omits it at the type level — every new listing starts
        // pending review, full stop.
        approvalStatus: 'pending',
      } as Prisma.VehicleUncheckedCreateInput,
    }) as unknown as Vehicle;
  },
  async update(id, data: VehicleUpdateInput) {
    try {
      return (await prisma.vehicle.update({
        where: { id },
        data: {
          ...data,
          ...(data.fuelEconomy !== undefined ? { fuelEconomy: toJsonInput(data.fuelEconomy) } : {}),
          ...(data.images !== undefined ? { images: toJsonInput(data.images) } : {}),
        } as Prisma.VehicleUncheckedUpdateInput,
      })) as unknown as Vehicle;
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
