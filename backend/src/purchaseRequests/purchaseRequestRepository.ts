export type PurchaseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** A vehicle's own fields, trimmed to what the UI needs when a request lists its vehicle inline. */
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
  /** Populated on reads that join the vehicle (list views) — absent right after create(). */
  vehicle?: PurchaseRequestVehicleSummary;
  /** Populated on admin reads that join the buyer. */
  buyerEmail?: string;
}

/**
 * What purchaseRequestService needs from storage — same narrow-interface,
 * DI-for-testing pattern as vehicleRepository.ts.
 */
export interface PurchaseRequestRepository {
  create(vehicleId: string, buyerId: string): Promise<PurchaseRequest>;
  findById(id: string): Promise<PurchaseRequest | null>;
  /** An existing PENDING request by this buyer for this vehicle, if any — used to reject duplicates. */
  findPendingForBuyerAndVehicle(vehicleId: string, buyerId: string): Promise<PurchaseRequest | null>;
  /** This buyer's own requests, newest first, vehicle included. */
  findByBuyer(buyerId: string): Promise<PurchaseRequest[]>;
  /** Every PENDING request, vehicle + buyer email included — admin review queue. */
  findPending(): Promise<PurchaseRequest[]>;
  decide(id: string, status: 'APPROVED' | 'REJECTED', decidedById: string): Promise<PurchaseRequest | null>;
}
