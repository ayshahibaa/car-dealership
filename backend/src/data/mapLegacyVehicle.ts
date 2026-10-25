import type { LegacyCar } from '../types/legacyCar.js';

export interface VehicleSeedInput {
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
  fuelType: string | null;
  transmission: string | null;
  transmissionDetail: string | null;
  gears: number | null;
  drivetrain: string | null;
  bodyType: string;
  engine: string | null;
  engineCapacityL: number | null;
  horsepower: number | null;
  exteriorColor: string | null;
  exteriorColorFamily: string | null;
  interiorColor: string | null;
  doors: number | null;
  seats: number | null;
  condition: string;
  accidentHistory: string | null;
  fuelEconomy: LegacyCar['fuelEconomy'];
  vin: string | null;
  sellerId: string | null;
  description: string | null;
  images: LegacyCar['images'];
  listingStatus: string;
  listedAt: Date | null;
  dataFlags: string[];
  sourceRow: number | null;
  listedById: null;
}

export function mapLegacyVehicle(car: LegacyCar): VehicleSeedInput {
  return {
    id: car.id,
    stockNumber: car.stockNumber,
    title: car.title,
    make: car.make,
    model: car.model,
    variant: car.variant,
    year: car.year,
    price: car.price,
    quantity: car.listingStatus === 'sold' ? 0 : 1,
    mileage: car.mileage,
    fuelType: car.fuelType,
    transmission: car.transmission,
    transmissionDetail: car.transmissionDetail,
    gears: car.gears,
    drivetrain: car.drivetrain,
    bodyType: car.bodyType,
    engine: car.engine,
    engineCapacityL: car.engineCapacityL,
    horsepower: car.horsepower,
    exteriorColor: car.exteriorColor,
    exteriorColorFamily: car.exteriorColorFamily,
    interiorColor: car.interiorColor,
    doors: car.doors,
    seats: car.seats,
    condition: car.condition,
    accidentHistory: car.accidentHistory,
    fuelEconomy: car.fuelEconomy,
    vin: car.vin,
    sellerId: car.sellerId,
    description: car.description,
    images: car.images,
    listingStatus: car.listingStatus,
    listedAt: car.listedAt ? new Date(`${car.listedAt}T00:00:00.000Z`) : null,
    dataFlags: car.dataFlags,
    sourceRow: car.sourceRow,
    listedById: null,
  };
}
