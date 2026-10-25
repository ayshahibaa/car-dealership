import { prisma } from '../db/prismaClient.js';
import type { PurchaseRequest, PurchaseRequestRepository } from './purchaseRequestRepository.js';

const vehicleSummarySelect = { id: true, stockNumber: true, title: true, price: true, quantity: true } as const;

type RawRequest = {
  id: string;
  vehicleId: string;
  buyerId: string;
  status: string;
  requestedAt: Date;
  decidedAt: Date | null;
  decidedById: string | null;
  vehicle?: { id: string; stockNumber: string; title: string; price: number; quantity: number };
  buyer?: { email: string };
};

function toPurchaseRequest(raw: RawRequest): PurchaseRequest {
  return {
    id: raw.id,
    vehicleId: raw.vehicleId,
    buyerId: raw.buyerId,
    status: raw.status as PurchaseRequest['status'],
    requestedAt: raw.requestedAt,
    decidedAt: raw.decidedAt,
    decidedById: raw.decidedById,
    ...(raw.vehicle ? { vehicle: raw.vehicle } : {}),
    ...(raw.buyer ? { buyerEmail: raw.buyer.email } : {}),
  };
}

export const prismaPurchaseRequestRepository: PurchaseRequestRepository = {
  async create(vehicleId, buyerId) {
    const created = await prisma.purchaseRequest.create({ data: { vehicleId, buyerId } });
    return toPurchaseRequest(created);
  },
  async findById(id) {
    const found = await prisma.purchaseRequest.findUnique({ where: { id } });
    return found ? toPurchaseRequest(found) : null;
  },
  async findPendingForBuyerAndVehicle(vehicleId, buyerId) {
    const found = await prisma.purchaseRequest.findFirst({ where: { vehicleId, buyerId, status: 'PENDING' } });
    return found ? toPurchaseRequest(found) : null;
  },
  async findByBuyer(buyerId) {
    const rows = await prisma.purchaseRequest.findMany({
      where: { buyerId },
      include: { vehicle: { select: vehicleSummarySelect } },
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map(toPurchaseRequest);
  },
  async findPending() {
    const rows = await prisma.purchaseRequest.findMany({
      where: { status: 'PENDING' },
      include: { vehicle: { select: vehicleSummarySelect }, buyer: { select: { email: true } } },
      orderBy: { requestedAt: 'asc' },
    });
    return rows.map(toPurchaseRequest);
  },
  async decide(id, status, decidedById) {
    try {
      const updated = await prisma.purchaseRequest.update({
        where: { id },
        data: { status, decidedAt: new Date(), decidedById },
        include: { vehicle: { select: vehicleSummarySelect } },
      });
      return toPurchaseRequest(updated);
    } catch {
      return null;
    }
  },
};
