import { Prisma } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';
import type { NewVehicleInput, Vehicle, VehicleFilter, VehicleRepository, VehicleUpdateInput } from './vehicleRepository.js';

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
        stockNumber: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        quantity: data.quantity ?? 1,
        listingStatus: 'available',
        listedById,
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
