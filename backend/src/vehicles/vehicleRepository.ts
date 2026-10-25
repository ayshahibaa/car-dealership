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
  approvalStatus?: string;
}

export interface VehicleFilter {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type NewVehicleInput = Omit<
  Vehicle,
  'id' | 'stockNumber' | 'quantity' | 'listingStatus' | 'listedById' | 'sellerId' | 'approvalStatus'
> & {
  quantity?: number;
};

export type VehicleUpdateInput = Partial<Omit<Vehicle, 'id' | 'stockNumber'>>;

export interface VehicleRepository {
  findAvailable(filter?: VehicleFilter): Promise<Vehicle[]>;
  findAll(): Promise<Vehicle[]>;
  findPending(): Promise<Vehicle[]>;
  findById(id: string): Promise<Vehicle | null>;
  create(data: NewVehicleInput, listedById: string): Promise<Vehicle>;
  update(id: string, data: VehicleUpdateInput): Promise<Vehicle | null>;
  remove(id: string): Promise<boolean>;
}
