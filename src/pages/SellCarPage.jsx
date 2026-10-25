import { useState } from 'react';
import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Textarea from '../components/common/Textarea.jsx';
import Button from '../components/common/Button.jsx';
import { ErrorMessage } from '../components/common/StatusMessage.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { createVehicle } from '../services/carService.js';
import { useAuth } from '../context/AuthContext.jsx';

const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible', 'Wagon', 'Minivan', 'Truck'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Dual-clutch'];
const CONDITIONS = ['New', 'Used'];
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'];
const DOOR_COUNTS = ['2', '3', '4', '5'];
const ACCIDENT_OPTIONS = [
  { value: 'none-reported', label: 'None reported' },
  { value: 'reported', label: 'At least one reported' },
];

const initialForm = {
  title: '',
  make: '',
  model: '',
  variant: '',
  year: new Date().getFullYear(),
  price: '',
  mileage: '',
  bodyType: BODY_TYPES[0],
  condition: CONDITIONS[1],
  fuelType: FUEL_TYPES[0],
  transmission: TRANSMISSIONS[0],
  gears: '',
  drivetrain: '',
  engine: '',
  engineCapacityL: '',
  horsepower: '',
  exteriorColor: '',
  interiorColor: '',
  doors: '',
  seats: '',
  accidentHistory: ACCIDENT_OPTIONS[0].value,
  vin: '',
  mpgMin: '',
  mpgMax: '',
  photoUrl: '',
  description: '',
};

/** '' -> null, otherwise Number(value) — for optional numeric fields. */
function optionalNumber(value) {
  return value === '' ? null : Number(value);
}

/** Builds the { min, max, unit } fuelEconomy JSON the backend stores, or null if neither mpg field was filled in. */
function buildFuelEconomy(mpgMin, mpgMax, fuelType) {
  const min = optionalNumber(mpgMin);
  const max = optionalNumber(mpgMax);
  if (min == null && max == null) return null;
  const lo = min ?? max;
  const hi = max ?? min;
  return { min: Math.min(lo, hi), max: Math.max(lo, hi), unit: fuelType === 'Electric' ? 'MPGe' : 'mpg' };
}

/**
 * The real "sell your car" form — any logged-in user can list a vehicle,
 * which calls POST /api/vehicles on the real backend (see carService.js's
 * createVehicle). Requires sign-in; the /sell route wraps this page in
 * RequireAuth (see App.jsx), so by the time this renders `user` is set.
 *
 * Covers every column of the Vehicle table a seller could reasonably know
 * about their own car (see backend/prisma/schema.prisma); it leaves out the
 * handful of columns that are either server-managed (stockNumber, quantity,
 * listingStatus, listedById) or demo/analytics bookkeeping from the original
 * dataset migration (sellerId, dataFlags, sourceRow, listedAt,
 * exteriorColorFamily) rather than something a real seller would fill in.
 */
export default function SellCarPage() {
  const { user, token } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [listed, setListed] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const gears = optionalNumber(form.gears);
      const vehicle = await createVehicle(
        {
          title: form.title,
          make: form.make,
          model: form.model,
          variant: form.variant || null,
          year: Number(form.year),
          price: Number(form.price),
          mileage: Number(form.mileage),
          bodyType: form.bodyType,
          condition: form.condition,
          fuelType: form.fuelType,
          transmission: form.transmission,
          transmissionDetail: gears ? `${gears}-Speed ${form.transmission}` : form.transmission || null,
          gears,
          drivetrain: form.drivetrain || null,
          engine: form.engine || null,
          engineCapacityL: optionalNumber(form.engineCapacityL),
          horsepower: optionalNumber(form.horsepower),
          exteriorColor: form.exteriorColor || null,
          interiorColor: form.interiorColor || null,
          doors: optionalNumber(form.doors),
          seats: optionalNumber(form.seats),
          accidentHistory: form.accidentHistory,
          fuelEconomy: buildFuelEconomy(form.mpgMin, form.mpgMax, form.fuelType),
          vin: form.vin || null,
          description: form.description || null,
          images: form.photoUrl
            ? [{ src: form.photoUrl, alt: form.title || 'Listed vehicle', kind: 'photo' }]
            : [],
        },
        token,
      );
      setListed(vehicle);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (listed) {
    return (
      <PageContainer className="py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-white/10 bg-ink-850 p-8 text-center">
          <h1 className="text-2xl font-bold">Submitted for review</h1>
          <p className="mt-2 text-ink-300">
            {listed.title} — {formatCurrency(listed.price)} · stock #{listed.stockNumber}
          </p>
          <p className="mt-2 text-sm text-ink-400">
            The Autoza team will review it and contact you soon — it's saved, not visible to buyers yet.
          </p>
          <p className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => { setListed(null); setForm(initialForm); }}>
              List another car
            </Button>
            <Link to="/cars" className="text-sm text-brand-400 underline self-center">Browse all cars</Link>
          </p>
          <p className="mt-6 text-xs text-ink-500">
            Note: this demo's "Browse cars" page reads a fixed sample dataset, so even once approved your
            listing won't appear there — it'll show up in the homepage's "Newly listed" section instead.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Sell your car</h1>
        <p className="mt-3 text-ink-300">
          Listed as {user?.email}. The Autoza team reviews every new listing before it goes public — it'll
          simply appear live once approved.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2" noValidate>
          <h2 className="sm:col-span-2 font-display text-lg font-semibold text-white">Basics</h2>
          <Input
            className="sm:col-span-2"
            label="Listing title"
            placeholder="e.g. 2021 Toyota Camry SE"
            required
            value={form.title}
            onChange={update('title')}
          />
          <Input label="Make" required value={form.make} onChange={update('make')} />
          <Input label="Model" required value={form.model} onChange={update('model')} />
          <Input label="Variant / trim" hint="Optional" value={form.variant} onChange={update('variant')} />
          <Input label="Year" type="number" min="1900" max="2100" required value={form.year} onChange={update('year')} />
          <Input label="Price (USD)" type="number" min="0" required value={form.price} onChange={update('price')} />
          <Input label="Mileage (mi)" type="number" min="0" required value={form.mileage} onChange={update('mileage')} />
          <Select label="Body type" options={BODY_TYPES} value={form.bodyType} onChange={update('bodyType')} />
          <Select label="Condition" options={CONDITIONS} value={form.condition} onChange={update('condition')} />

          <h2 className="sm:col-span-2 mt-2 font-display text-lg font-semibold text-white">Performance & drivetrain</h2>
          <Select label="Fuel type" options={FUEL_TYPES} value={form.fuelType} onChange={update('fuelType')} />
          <Select label="Transmission" options={TRANSMISSIONS} value={form.transmission} onChange={update('transmission')} />
          <Input label="Gears" type="number" min="1" max="12" hint="Optional" value={form.gears} onChange={update('gears')} />
          <Select
            label="Drivetrain"
            placeholder="Not specified"
            options={DRIVETRAINS}
            value={form.drivetrain}
            onChange={update('drivetrain')}
          />
          <Input
            className="sm:col-span-2"
            label="Engine"
            hint="Optional — e.g. 2.0L I4 16V GDI DOHC Turbo"
            value={form.engine}
            onChange={update('engine')}
          />
          <Input
            label="Engine capacity (L)"
            type="number"
            step="0.1"
            min="0"
            hint="Optional"
            value={form.engineCapacityL}
            onChange={update('engineCapacityL')}
          />
          <Input label="Horsepower" type="number" min="0" hint="Optional" value={form.horsepower} onChange={update('horsepower')} />
          <Input label="Min MPG" type="number" min="0" hint="Optional" value={form.mpgMin} onChange={update('mpgMin')} />
          <Input label="Max MPG" type="number" min="0" hint="Optional" value={form.mpgMax} onChange={update('mpgMax')} />

          <h2 className="sm:col-span-2 mt-2 font-display text-lg font-semibold text-white">Appearance</h2>
          <Input label="Exterior colour" hint="Optional" value={form.exteriorColor} onChange={update('exteriorColor')} />
          <Input label="Interior colour" hint="Optional" value={form.interiorColor} onChange={update('interiorColor')} />
          <Select label="Doors" placeholder="Not specified" options={DOOR_COUNTS} value={form.doors} onChange={update('doors')} />
          <Input label="Seats" type="number" min="1" max="12" hint="Optional" value={form.seats} onChange={update('seats')} />

          <h2 className="sm:col-span-2 mt-2 font-display text-lg font-semibold text-white">Condition & history</h2>
          <Select
            label="Accident history"
            options={ACCIDENT_OPTIONS}
            value={form.accidentHistory}
            onChange={update('accidentHistory')}
          />
          <Input label="VIN" maxLength={17} hint="Optional — 17 characters" value={form.vin} onChange={update('vin')} />

          <h2 className="sm:col-span-2 mt-2 font-display text-lg font-semibold text-white">Photo & description</h2>
          <Input
            className="sm:col-span-2"
            label="Photo URL"
            hint="Optional — paste a link to a photo of the car."
            value={form.photoUrl}
            onChange={update('photoUrl')}
          />
          <Textarea
            className="sm:col-span-2"
            label="Description"
            hint="Optional — anything a buyer should know."
            value={form.description}
            onChange={update('description')}
          />

          {error && <div className="sm:col-span-2"><ErrorMessage error={error} title="Could not list your car" /></div>}

          <Button type="submit" className="sm:col-span-2" loading={submitting}>
            List this car
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
