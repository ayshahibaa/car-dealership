import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/db/prismaClient.js';
import { mapLegacyVehicle } from '../src/data/mapLegacyVehicle.js';
import type { LegacyCar } from '../src/types/legacyCar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.join(__dirname, 'seed-data', 'cars.json');

interface LegacyDataset {
  meta: { recordCount: number };
  cars: LegacyCar[];
}

/**
 * One-time migration of the frontend's cleaned demo dataset
 * (prisma/seed-data/cars.json — a copy of src/data/cars.json) into Postgres.
 * Upserts by stockNumber, so running this more than once updates existing
 * rows instead of duplicating them — safe to re-run after a schema change.
 */
async function main(): Promise<void> {
  const raw = await readFile(DATASET_PATH, 'utf-8');
  const { meta, cars }: LegacyDataset = JSON.parse(raw);

  console.log(`Seeding ${cars.length} vehicles (dataset reports ${meta.recordCount})...`);

  let seeded = 0;
  for (const car of cars) {
    const data = mapLegacyVehicle(car);
    // Prisma's Json columns need `Prisma.JsonNull` (not a bare `null`) to mean
    // "set this column to SQL NULL" — same gotcha as prismaVehicleRepository.ts.
    const fuelEconomy = data.fuelEconomy === null ? Prisma.JsonNull : data.fuelEconomy;
    await prisma.vehicle.upsert({
      where: { stockNumber: data.stockNumber },
      create: { ...data, fuelEconomy } as Prisma.VehicleUncheckedCreateInput,
      update: { ...data, fuelEconomy } as Prisma.VehicleUncheckedUpdateInput,
    });
    seeded += 1;
  }

  console.log(`Seeded ${seeded} vehicles.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
