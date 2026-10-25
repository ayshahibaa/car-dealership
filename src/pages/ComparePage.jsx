import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import { ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import CompareTable from '../components/compare/CompareTable.jsx';
import RadarChart from '../components/compare/RadarChart.jsx';
import { buildRadarData } from '../components/compare/radarScoring.js';
import { IconClose } from '../components/icons/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useCompare } from '../context/CompareContext.jsx';
import { getCars, getCarsByIds } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';

const RADAR_COLORS = ['#e8414f', '#60a5fa', '#34d399'];

function CompareHeaderCard({ car, onRemove }) {
  const image = car.images?.[0];
  return (
    <div className="relative flex flex-col items-center rounded-card bg-ink-850 p-4 text-center shadow-card ring-1 ring-white/5">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${car.title} from comparison`}
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-paper hover:bg-black/70"
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
      <img src={image?.src} alt={image?.alt ?? car.title} className="h-28 w-full rounded-md bg-ink-200 object-cover" />
      <Link to={`/cars/${car.id}`} className="mt-3 line-clamp-2 font-display text-sm font-semibold text-white hover:text-brand-300">
        {car.title}
      </Link>
      <p className="mt-1 text-lg font-bold text-brand-400">{formatCurrency(car.price)}</p>
    </div>
  );
}

function AddCarSlot({ onAdd, excludeIds }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { items } = await getCars({ q: query, pageSize: 6 });
      setResults(items.filter((c) => !excludeIds.includes(c.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex min-h-[13rem] flex-col items-center justify-center rounded-card border-2 border-dashed border-white/15 p-5 text-center">
      <p className="font-display text-sm font-semibold text-white">Add a car to compare</p>
      <div className="relative mt-3 w-full max-w-xs">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search make, model or keyword"
          className="w-full rounded-md border border-white/15 bg-ink-800 px-3 py-2 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
        {query.trim() && (
          <div className="absolute inset-x-0 top-full z-10 mt-1.5 max-h-56 overflow-y-auto rounded-md border border-white/10 bg-ink-900 text-left shadow-card">
            {searching && <p className="px-3 py-2 text-sm text-ink-400">Searching…</p>}
            {!searching && results.length === 0 && <p className="px-3 py-2 text-sm text-ink-400">No matches</p>}
            {!searching &&
              results.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => {
                    onAdd(car.id);
                    setQuery('');
                    setResults([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-white/10 hover:text-white"
                >
                  {car.title} <span className="text-ink-500">· {formatCurrency(car.price)}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ids, max, add, remove, setIds } = useCompare();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (ids.length === 0) {
      const fromUrl = (searchParams.get('ids') ?? '').split(',').filter(Boolean);
      if (fromUrl.length) setIds(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (ids.length) next.set('ids', ids.join(','));
    else next.delete('ids');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const { data: cars, loading, error } = useAsync(() => (ids.length ? getCarsByIds(ids) : Promise.resolve([])), [ids.join(',')]);

  const columnCount = ids.length < 2 ? 2 : ids.length < max ? ids.length + 1 : max;
  const gridClass = columnCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <PageContainer className="py-10">
      <h1 className="text-3xl font-bold">Compare cars</h1>
      <p className="mt-2 text-ink-400">Compare up to {max} cars side by side, spec by spec.</p>

      <div className={`mt-8 grid grid-cols-1 gap-4 ${gridClass}`}>
        {Array.from({ length: columnCount }, (_, i) => {
          const id = ids[i];
          const car = cars?.find((c) => c.id === id);
          if (id && (car || loading)) {
            return car ? (
              <CompareHeaderCard key={id} car={car} onRemove={() => remove(id)} />
            ) : (
              <div key={id} className="h-[13rem] animate-pulse rounded-card bg-ink-800" />
            );
          }
          return <AddCarSlot key={`add-${i}`} onAdd={add} excludeIds={ids} />;
        })}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage error={error} title="Could not load one of these cars" />
        </div>
      )}

      {!loading && !error && cars && cars.length >= 2 && (
        <>
          <div className="mt-10">
            <h2 className="font-display text-lg font-bold text-white">At a glance</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-400">
              A visual summary computed from the specs below — each score is relative to just the {cars.length} cars shown here (price, mileage,
              year, fuel economy, power and accident history), not an absolute rating.
            </p>
            <div className="mt-6 flex justify-center rounded-card bg-ink-850 p-6 shadow-card ring-1 ring-white/5">
              {(() => {
                const { axes, series } = buildRadarData(cars);
                const colored = series.map((s, i) => ({ ...s, color: RADAR_COLORS[i % RADAR_COLORS.length] }));
                return <RadarChart axes={axes} series={colored} />;
              })()}
            </div>
          </div>

          <CompareTable cars={cars} />
        </>
      )}

      {!loading && !error && cars && cars.length === 1 && (
        <p className="mt-10 text-center text-ink-400">Add one more car above to see the full comparison.</p>
      )}

      {!loading && !error && (!cars || cars.length === 0) && (
        <div className="mt-10">
          <EmptyState title="No cars selected yet">
            Search for a car above, or browse the{' '}
            <Link to="/cars" className="font-semibold text-brand-400 hover:text-brand-300">
              inventory
            </Link>{' '}
            and tap the compare icon on any listing.
          </EmptyState>
        </div>
      )}
    </PageContainer>
  );
}
