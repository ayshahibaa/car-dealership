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
  images: unknown;
  listingStatus: string;
  listedById: string | null;
}

export interface VehicleFilter {
  make?: string;
  model?: string;
  /** "category" in the kata's wording — bodyType in this schema. */
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type NewVehicleInput = Omit<Vehicle, 'id' | 'stockNumber' | 'quantity' | 'listingStatus' | 'listedById'> & {
  quantity?: number;
};

export type VehicleUpdateInput = Partial<Omit<Vehicle, 'id' | 'stockNumber'>>;

/**
 * What vehicleService needs from storage — same narrow-interface pattern as
 * auth/userRepository.ts, so the service's actual rules are testable with an
 * in-memory fake instead of a live database.
 */
export interface VehicleRepository {
  /** No filter = every available vehicle (GET /vehicles); a filter = search (GET /vehicles/search). */
  findAvailable(filter?: VehicleFilter): Promise<Vehicle[]>;
  findById(id: string): Promise<Vehicle | null>;
  create(data: NewVehicleInput, listedById: string): Promise<Vehicle>;
  update(id: string, data: VehicleUpdateInput): Promise<Vehicle | null>;
  remove(id: string): Promise<boolean>;
}
