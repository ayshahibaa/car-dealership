export type PurchaseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PurchaseRequestVehicleSummary {
  id: string;
  stockNumber: string;
  title: string;
  price: number;
  quantity: number;
}

export interface PurchaseRequest {
  id: string;
  vehicleId: string;
  buyerId: string;
  status: PurchaseRequestStatus;
  requestedAt: Date;
  decidedAt: Date | null;
  decidedById: string | null;
  vehicle?: PurchaseRequestVehicleSummary;
  buyerEmail?: string;
}

export interface PurchaseRequestRepository {
  create(vehicleId: string, buyerId: string): Promise<PurchaseRequest>;
  findById(id: string): Promise<PurchaseRequest | null>;
  findPendingForBuyerAndVehicle(vehicleId: string, buyerId: string): Promise<PurchaseRequest | null>;
  findByBuyer(buyerId: string): Promise<PurchaseRequest[]>;
  findPending(): Promise<PurchaseRequest[]>;
  decide(id: string, status: 'APPROVED' | 'REJECTED', decidedById: string): Promise<PurchaseRequest | null>;
}
