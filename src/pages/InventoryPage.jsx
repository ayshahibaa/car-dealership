import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import { ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import { CarCardSkeletonGrid } from '../components/cars/CarCardSkeleton.jsx';
import CarCard from '../components/cars/CarCard.jsx';
import FilterBar from '../components/cars/FilterBar.jsx';
import MakeChips from '../components/cars/MakeChips.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Select from '../components/common/Select.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { getCars, getFilterOptions } from '../services/carService.js';

// Params that count as an active filter for the "Clear filters" link —
// sort and page are navigation state, not filters.
const FILTER_KEYS = ['q', 'make', 'bodyType', 'fuelType', 'transmission', 'drivetrain', 'color', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'maxMileage'];

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const { data: options } = useAsync(() => getFilterOptions(), []);
  const { data, loading, error } = useAsync(() => getCars(query), [searchParams.toString()]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, String(value));
    next.delete('page'); // any filter change starts back at page 1
    setSearchParams(next, { replace: true });
  }

  function setPage(page) {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    for (const key of FILTER_KEYS) next.delete(key);
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  const activeFilterCount = FILTER_KEYS.filter((key) => query[key]).length;

  return (
    <PageContainer className="py-10">
      <h1 className="text-3xl font-bold">Browse cars</h1>

      <div className="mt-6">
        <FilterBar options={options} query={query} onChange={updateParam} />
      </div>

      {options?.makes?.length > 0 && (
        <div className="mt-4">
          <MakeChips makes={options.makes} activeMake={query.make ?? ''} onSelect={(make) => updateParam('make', make)} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-ink-400" aria-live="polite">
          {loading
            ? 'Searching…'
            : data
              ? `${data.total.toLocaleString()} ${data.total === 1 ? 'car' : 'cars'} available${
                  data.totalPages > 1 ? ` · page ${data.page} of ${data.totalPages}` : ''
                }`
              : null}
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="ml-3 font-semibold text-brand-400 hover:text-brand-300">
              Clear filters
            </button>
          )}
        </p>
        <Select
          label="Sort"
          value={query.sort ?? 'recent'}
          onChange={(e) => updateParam('sort', e.target.value === 'recent' ? '' : e.target.value)}
          options={options?.sortOptions ?? []}
          className="w-full sm:w-56"
        />
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage error={error} title="Could not load the inventory" />
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <CarCardSkeletonGrid count={8} />
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No cars match your filters">Try removing a filter or searching for something else.</EmptyState>
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>

          <div className="mt-10">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </PageContainer>
  );
}
