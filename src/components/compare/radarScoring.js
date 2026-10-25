const BODY_TYPE_COMFORT_RANK = {
  Convertible: 2,
  Coupe: 3,
  Hatchback: 3,
  Truck: 4,
  Van: 5,
  Sedan: 6,
  Wagon: 7,
  SUV: 8,
  Minivan: 9,
};

const AXIS_DEFS = [
  { key: 'price', label: 'Price Value', get: (c) => c.price, direction: 'lower' },
  { key: 'mileage', label: 'Low Mileage', get: (c) => c.mileage, direction: 'lower' },
  { key: 'year', label: 'Year', get: (c) => c.year, direction: 'higher' },
  {
    key: 'fuelEconomy',
    label: 'Fuel Economy',
    get: (c) => (c.fuelEconomy ? (c.fuelEconomy.min + c.fuelEconomy.max) / 2 : null),
    direction: 'higher',
  },
  { key: 'horsepower', label: 'Power', get: (c) => c.horsepower, direction: 'higher' },
  {
    key: 'comfort',
    label: 'Comfort',
    get: (c) => BODY_TYPE_COMFORT_RANK[c.bodyType] ?? null,
    direction: 'higher',
  },
];

export function buildRadarData(cars) {
  const usableAxes = AXIS_DEFS.filter((axis) => cars.every((c) => axis.get(c) !== null && axis.get(c) !== undefined));

  const axes = usableAxes.map((a) => ({ label: a.label }));
  const series = cars.map((car) => ({ id: car.id, name: car.title, values: [] }));

  usableAxes.forEach((axis) => {
    const raw = cars.map((c) => axis.get(c));
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    raw.forEach((value, i) => {
      const score = max === min ? 100 : axis.direction === 'lower' ? (100 * (max - value)) / (max - min) : (100 * (value - min)) / (max - min);
      series[i].values.push(Math.round(score));
    });
  });

  return { axes, series };
}
