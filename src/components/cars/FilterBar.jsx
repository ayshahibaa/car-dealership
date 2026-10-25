import { useEffect, useRef, useState } from 'react';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatMileage } from '../../utils/formatMileage.js';
import { appConfig } from '../../config/appConfig.js';

const PRICE_BANDS = [10000, 20000, 35000, 50000, 75000, 100000];
const MILEAGE_BANDS = [10000, 25000, 50000, 75000, 100000, 150000];

function countOptions(entries = []) {
  return entries.map(({ value, count }) => ({ value, label: `${value} (${count})` }));
}

function yearOptions(range) {
  if (!range) return [];
  const years = [];
  for (let y = range.max; y >= range.min; y -= 1) years.push(y);
  return years.map((y) => ({ value: y, label: String(y) }));
}

export default function FilterBar({ options, query, onChange }) {
  const [qText, setQText] = useState(query.q ?? '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setQText(query.q ?? '');
  }, [query.q]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function handleTextChange(value) {
    setQText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange('q', value), 350);
  }

  const mileageUnit = appConfig.region.distanceUnit === 'km' ? 'km' : 'mi';

  return (
    <div className="rounded-card bg-ink-850 p-4 shadow-card ring-1 ring-white/5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          label="Make and model"
          placeholder="Search make, model or keyword"
          value={qText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="lg:col-span-2"
        />
        <Select
          label="Min price"
          placeholder="Any"
          value={query.minPrice ?? ''}
          onChange={(e) => onChange('minPrice', e.target.value)}
          options={PRICE_BANDS.map((p) => ({ value: p, label: `${formatCurrency(p)}+` }))}
        />
        <Select
          label="Max price"
          placeholder="Any"
          value={query.maxPrice ?? ''}
          onChange={(e) => onChange('maxPrice', e.target.value)}
          options={PRICE_BANDS.map((p) => ({ value: p, label: `Under ${formatCurrency(p)}` }))}
        />
        <Select
          label="Year from"
          placeholder="Any"
          value={query.minYear ?? ''}
          onChange={(e) => onChange('minYear', e.target.value)}
          options={yearOptions(options?.year)}
        />
        <Select
          label="Max mileage"
          placeholder="Any"
          value={query.maxMileage ?? ''}
          onChange={(e) => onChange('maxMileage', e.target.value)}
          options={MILEAGE_BANDS.map((m) => ({ value: m, label: `Under ${formatMileage(m, { unit: mileageUnit })}` }))}
        />
      </div>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-brand-400 hover:text-brand-300">
          More filters
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Body type"
            placeholder="Any"
            value={query.bodyType ?? ''}
            onChange={(e) => onChange('bodyType', e.target.value)}
            options={countOptions(options?.bodyTypes)}
          />
          <Select
            label="Fuel type"
            placeholder="Any"
            value={query.fuelType ?? ''}
            onChange={(e) => onChange('fuelType', e.target.value)}
            options={countOptions(options?.fuelTypes)}
          />
          <Select
            label="Transmission"
            placeholder="Any"
            value={query.transmission ?? ''}
            onChange={(e) => onChange('transmission', e.target.value)}
            options={countOptions(options?.transmissions)}
          />
          <Select
            label="Drivetrain"
            placeholder="Any"
            value={query.drivetrain ?? ''}
            onChange={(e) => onChange('drivetrain', e.target.value)}
            options={countOptions(options?.drivetrains)}
          />
          <Select
            label="Color"
            placeholder="Any"
            value={query.color ?? ''}
            onChange={(e) => onChange('color', e.target.value)}
            options={countOptions(options?.colors)}
          />
        </div>
      </details>
    </div>
  );
}
