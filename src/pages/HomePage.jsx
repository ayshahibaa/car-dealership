import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import Section from '../components/layout/Section.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Button from '../components/common/Button.jsx';
import CarRow from '../components/cars/CarRow.jsx';
import { IconCheck, IconSearch } from '../components/icons/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { getFeaturedCars, getRecentCars, getFilterOptions, getCommunityListings } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { appConfig } from '../config/appConfig.js';

// Round price bands for the hero search. These are UI buckets only — not a
// dataset fact — so the lack of a matching listing just yields a normal
// "no cars found" result on the inventory page, same as any other filter.
const PRICE_BANDS = [10000, 20000, 35000, 50000, 75000];

const HOW_IT_WORKS = [
  { title: 'Browse the inventory', body: 'Search by make, model, price and more to find cars that fit what you need.' },
  { title: 'Compare the details', body: 'Every listing shows the full specs, condition and accident history we have on file.' },
  { title: 'Reach out to enquire', body: 'Send an enquiry straight from a listing and we’ll get back to you.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');

  const { data: options } = useAsync(() => getFilterOptions(), []);
  const { data: featured, loading: loadingFeatured, error: errorFeatured } = useAsync(() => getFeaturedCars(4), []);
  const { data: recent, loading: loadingRecent, error: errorRecent } = useAsync(() => getRecentCars(4), []);
  // The only place real, admin-approved seller submissions show up — see
  // carService.js's getCommunityListings for why the rest of the site still
  // reads the fixed local dataset.
  const { data: community, loading: loadingCommunity, error: errorCommunity } = useAsync(() => getCommunityListings(4), []);

  const yearOptions = useMemo(() => {
    if (!options?.year) return [];
    const { min, max } = options.year;
    const years = [];
    for (let y = max; y >= min; y -= 1) years.push(y);
    return years;
  }, [options]);

  const bodyTypes = options?.bodyTypes ?? [];

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minYear) params.set('minYear', minYear);
    navigate(params.toString() ? `/cars?${params.toString()}` : '/cars');
  }

  return (
    <>
      {/* Hero */}
      <Section tone="dark" className="pt-14 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Used cars, made simple</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold text-white sm:text-5xl">
          Find your perfect used car
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-300">{appConfig.brand.tagline}.</p>

        <form
          onSubmit={handleSearch}
          className="mt-8 grid grid-cols-1 gap-3 rounded-card bg-ink-850 p-4 shadow-card ring-1 ring-white/5 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
        >
          <Input
            label="Make and model"
            placeholder="e.g. Toyota Camry"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            label="Max price"
            placeholder="Any price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            options={PRICE_BANDS.map((p) => ({ value: p, label: `Under ${formatCurrency(p)}` }))}
          />
          <Select
            label="Year from"
            placeholder="Any year"
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            options={yearOptions.map((y) => ({ value: y, label: String(y) }))}
          />
          <Button type="submit" size="lg" className="sm:mb-0">
            <IconSearch className="h-4 w-4" /> Search
          </Button>
        </form>

        {bodyTypes.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2.5 pb-14 sm:pb-20">
            {bodyTypes.map(({ value, count }) => (
              <Link
                key={value}
                to={`/cars?bodyType=${encodeURIComponent(value)}`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-brand-500 hover:bg-brand-500/10 hover:text-white"
              >
                {value} <span className="text-ink-400">({count})</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Featured */}
      <Section tone="darker">
        <CarRow
          title="Featured cars"
          subtitle="A mix of our newest, accident-free listings"
          viewAllHref="/cars"
          cars={featured}
          loading={loadingFeatured}
          error={errorFeatured}
        />
      </Section>

      {/* Recently added */}
      <Section tone="dark">
        <CarRow
          title="Recently added"
          subtitle="The latest listings to join the inventory"
          viewAllHref="/cars?sort=recent"
          cars={recent}
          loading={loadingRecent}
          error={errorRecent}
        />
      </Section>

      {/* Community listings: real seller submissions, admin-approved — the
          one place "sell your car" actually becomes visible (see
          SellCarPage.jsx and carService.js's getCommunityListings). Hidden
          entirely while there's nothing approved yet, rather than showing
          an empty section on every fresh install of the demo. */}
      {!errorCommunity && (loadingCommunity || community?.length > 0) && (
        <Section tone="darker">
          <CarRow
            title="Newly listed by our community"
            subtitle='Real cars submitted through "Sell your car" and approved by an admin'
            cars={community}
            loading={loadingCommunity}
          />
        </Section>
      )}

      {/* How it works */}
      <Section tone="light">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-ink-700">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 flex items-center gap-2 text-sm text-ink-600">
          <IconCheck className="h-4 w-4 text-green-600" />
          This is a demo marketplace built to showcase the product — listings and images are sample data.
        </p>
      </Section>
    </>
  );
}
