export interface Vehicle {
  id: string;
  stockNumber: string;
  title: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  quantity: number;
  mileage: number;
  bodyType: string;
  condition: string;
  fuelType: string | null;
  transmission: string | null;
  // Everything below is optional on this interface (not just nullable in the
  // DB) because the handful of pre-existing Vehicle fixtures in test files
  // only ever set the fields above — adding a required key here would break
  // every one of those literals for no benefit, since Prisma already treats
  // them as nullable columns.
  transmissionDetail?: string | null;
  gears?: number | null;
  drivetrain?: string | null;
  engine?: string | null;
  engineCapacityL?: number | null;
  horsepower?: number | null;
  exteriorColor?: string | null;
  exteriorColorFamily?: string | null;
  interiorColor?: string | null;
  doors?: number | null;
  seats?: number | null;
  accidentHistory?: string | null;
  fuelEconomy?: { min: number; max: number; unit: string } | null;
  vin?: string | null;
  sellerId?: string | null;
  description?: string | null;
  images: unknown;
  listingStatus: string;
  listedById: string | null;
  // "pending" | "approved" | "rejected" — optional on this interface for the
  // same fixture-compatibility reason as the block above; defaults to
  // "approved" in the DB and is forced server-side on create (see
  // prismaVehicleRepository.ts), never trusted from client input.
  approvalStatus?: string;
}

export interface VehicleFilter {
  make?: string;
  model?: string;
  /** "category" in the kata's wording — bodyType in this schema. */
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// sellerId is excluded even though it's a real column: it's an anonymised
// id derived from the original dataset's seller location (see
// data/cleaning/clean_inventory.py), not something a user listing their own
// car should be able to set directly. approvalStatus is excluded for the
// same reason as a different column: a seller can't self-approve their own
// listing — the repository always forces "pending" on create.
export type NewVehicleInput = Omit<
  Vehicle,
  'id' | 'stockNumber' | 'quantity' | 'listingStatus' | 'listedById' | 'sellerId' | 'approvalStatus'
> & {
  quantity?: number;
};

export type VehicleUpdateInput = Partial<Omit<Vehicle, 'id' | 'stockNumber'>>;

/**
 * What vehicleService needs from storage — same narrow-interface pattern as
 * auth/userRepository.ts, so the service's actual rules are testable with an
 * in-memory fake instead of a live database.
 */
export interface VehicleRepository {
  /** No filter = every approved, available vehicle (GET /vehicles); a filter = search (GET /vehicles/search). */
  findAvailable(filter?: VehicleFilter): Promise<Vehicle[]>;
  /** Every vehicle regardless of quantity or approval — admin-only (GET /vehicles/admin/all), so a sold car can be restocked. */
  findAll(): Promise<Vehicle[]>;
  /** Vehicles awaiting moderation — admin-only (GET /vehicles/admin/pending). */
  findPending(): Promise<Vehicle[]>;
  findById(id: string): Promise<Vehicle | null>;
  create(data: NewVehicleInput, listedById: string): Promise<Vehicle>;
  update(id: string, data: VehicleUpdateInput): Promise<Vehicle | null>;
  remove(id: string): Promise<boolean>;
}
