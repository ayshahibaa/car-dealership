import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatMileage } from '../../utils/formatMileage.js';

const show = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const GROUPS = [
  {
    title: 'Overview',
    rows: [
      { label: 'Price', get: (c) => c.price, format: (c) => formatCurrency(c.price), rank: 'lower' },
      { label: 'Year', get: (c) => c.year, format: (c) => show(c.year), rank: 'higher' },
      { label: 'Mileage', get: (c) => c.mileage, format: (c) => formatMileage(c.mileage), rank: 'lower' },
      { label: 'Condition', get: (c) => c.condition, format: (c) => show(c.condition) },
      {
        label: 'Accident history',
        get: (c) => c.accidentHistory,
        format: (c) => (c.accidentHistory === 'none-reported' ? 'No accidents reported' : c.accidentHistory === 'reported' ? 'Accident reported' : show(null)),
        rank: 'flag',
        goodValue: 'none-reported',
      },
    ],
  },
  {
    title: 'Mechanical',
    rows: [
      { label: 'Engine', get: (c) => c.engine, format: (c) => show(c.engine) },
      { label: 'Horsepower', get: (c) => c.horsepower, format: (c) => (c.horsepower != null ? `${c.horsepower} hp` : show(null)), rank: 'higher' },
      { label: 'Fuel type', get: (c) => c.fuelType, format: (c) => show(c.fuelType) },
      { label: 'Transmission', get: (c) => c.transmissionDetail ?? c.transmission, format: (c) => show(c.transmissionDetail ?? c.transmission) },
      { label: 'Drivetrain', get: (c) => c.drivetrain, format: (c) => show(c.drivetrain) },
    ],
  },
  {
    title: 'Details',
    rows: [
      { label: 'Body type', get: (c) => c.bodyType, format: (c) => show(c.bodyType) },
      { label: 'Exterior color', get: (c) => c.exteriorColor, format: (c) => show(c.exteriorColor) },
      { label: 'Doors', get: (c) => c.doors, format: (c) => show(c.doors) },
      { label: 'Seats', get: (c) => c.seats, format: (c) => show(c.seats) },
    ],
  },
];

function winningIndexes(row, cars) {
  const values = cars.map(row.get);

  if (row.rank === 'flag') {
    const hasGood = values.some((v) => v === row.goodValue);
    const hasOther = values.some((v) => v != null && v !== row.goodValue);
    if (!hasGood || !hasOther) return values.map(() => false);
    return values.map((v) => v === row.goodValue);
  }

  if (row.rank !== 'lower' && row.rank !== 'higher') return values.map(() => false);
  const numeric = values.filter((v) => typeof v === 'number');
  if (numeric.length < 2 || new Set(numeric).size < 2) return values.map(() => false);
  const best = row.rank === 'lower' ? Math.min(...numeric) : Math.max(...numeric);
  return values.map((v) => typeof v === 'number' && v === best);
}

export default function CompareTable({ cars }) {
  const gridStyle = { gridTemplateColumns: `minmax(88px, 140px) repeat(${cars.length}, minmax(100px, 1fr))` };
  const minWidth = cars.length >= 3 ? 'min-w-[460px]' : 'min-w-0';

  return (
    <div className="mt-10">
      {GROUPS.map((group) => (
        <div key={group.title} className="mb-8">
          <h2 className="font-display text-lg font-bold text-white">{group.title}</h2>
          <div className="mt-3 overflow-x-auto rounded-card bg-ink-850 shadow-card ring-1 ring-white/5">
            <div className={`${minWidth} divide-y divide-white/5`}>
              {group.rows.map((row) => {
                const wins = winningIndexes(row, cars);
                return (
                  <div key={row.label} className="grid items-center gap-3 px-4 py-3" style={gridStyle}>
                    <p className="text-sm font-medium text-ink-400">{row.label}</p>
                    {cars.map((car, i) => (
                      <p key={car.id} className={`text-sm ${wins[i] ? 'font-semibold text-green-700' : 'text-white'}`}>
                        {row.format(car)}
                        {wins[i] && <span className="ml-1.5 align-middle text-xs">✓ Best</span>}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
