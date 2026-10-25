// check_dataset.mjs — runs validateCar over every record in src/data/cars.json
// Usage (from project root):  node data/cleaning/check_dataset.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateCar } from '../../src/utils/validateCar.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { meta, cars } = JSON.parse(readFileSync(join(root, 'src/data/cars.json'), 'utf8'));

let invalid = 0, withWarnings = 0, missingImageFiles = 0;
const ids = new Set();
for (const car of cars) {
  const { valid, errors, warnings } = validateCar(car, { currentYear: 2026 });
  if (ids.has(car.id)) { console.log(`DUPLICATE id ${car.id}`); invalid++; }
  ids.add(car.id);
  if (!valid) { invalid++; console.log(`INVALID ${car.stockNumber}: ${errors.join('; ')}`); }
  if (warnings.length) withWarnings++;
  for (const img of car.images) {
    if (!existsSync(join(root, 'public', img.src))) { missingImageFiles++; console.log(`MISSING IMAGE ${img.src}`); }
  }
}
console.log(`records: ${cars.length} (meta says ${meta.recordCount})`);
console.log(`invalid: ${invalid}, with warnings: ${withWarnings}, missing image files: ${missingImageFiles}`);
process.exit(invalid || missingImageFiles ? 1 : 0);
