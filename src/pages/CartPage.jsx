import { useState } from 'react';
import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Button from '../components/common/Button.jsx';
import { Loader, ErrorMessage, EmptyState, SuccessMessage } from '../components/common/StatusMessage.jsx';
import { IconClose } from '../components/icons/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCarsByIds, requestPurchase } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatMileage } from '../utils/formatMileage.js';

function CartRow({ car, onRemove }) {
  const image = car.images?.[0];
  const soldOut = (car.quantity ?? 1) <= 0 || car.listingStatus === 'sold';

  return (
    <li className="flex items-center gap-4 rounded-card bg-ink-850 p-4 shadow-card ring-1 ring-white/5">
      <img src={image?.src} alt={image?.alt ?? car.title} className="h-16 w-24 shrink-0 rounded-md bg-ink-200 object-cover" />
      <div className="min-w-0 flex-1">
        <Link to={`/cars/${car.id}`} className="line-clamp-1 font-display text-sm font-semibold text-white hover:text-brand-300">
          {car.title}
        </Link>
        <p className="mt-0.5 text-xs text-ink-400">{car.year} · {formatMileage(car.mileage)}</p>
        {soldOut && <p className="mt-0.5 text-xs font-medium text-brand-400">No longer available</p>}
      </div>
      <p className="shrink-0 font-bold text-brand-400">{formatCurrency(car.price)}</p>
      <button
        type="button"
        onClick={() => onRemove(car.id)}
        aria-label={`Remove ${car.title} from cart`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-white/10 hover:text-white"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function CartPage() {
  const { ids, remove } = useCart();
  const { isAuthenticated, token } = useAuth();
  const { data: cars, loading, error } = useAsync(
    () => (ids.length ? getCarsByIds(ids) : Promise.resolve([])),
    [ids.join(',')],
  );

  const [checkingOut, setCheckingOut] = useState(false);
  const [results, setResults] = useState(null);

  const requestable = (cars ?? []).filter((c) => (c.quantity ?? 1) > 0 && c.listingStatus !== 'sold');
  const total = requestable.reduce((sum, c) => sum + (c.price ?? 0), 0);

  async function handleCheckout() {
    setCheckingOut(true);
    setResults(null);
    const requested = [];
    const failed = [];
    for (const car of requestable) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await requestPurchase(car.id, token);
        requested.push(car.id);
      } catch (err) {
        failed.push({ id: car.id, title: car.title, message: err.message });
      }
    }
    requested.forEach(remove);
    setResults({ requested, failed });
    setCheckingOut(false);
  }

  return (
    <PageContainer className="py-12">
      <h1 className="text-3xl font-bold">Your cart</h1>

      {results && (
        <div className="mt-6 space-y-2">
          {results.requested.length > 0 && (
            <SuccessMessage title="Request sent">
              The Autoza team will review your {results.requested.length === 1 ? 'request' : `${results.requested.length} requests`} and
              contact you soon — track {results.requested.length === 1 ? 'it' : 'them'} on your{' '}
              <Link className="underline" to="/orders">orders page</Link>.
            </SuccessMessage>
          )}
          {results.failed.map((f) => (
            <ErrorMessage key={f.id} error={{ message: f.message }} title={`Could not request ${f.title}`} />
          ))}
        </div>
      )}

      {loading && <Loader label="Loading your cart…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} title="Could not load your cart" /></div>}

      {!loading && !error && cars && cars.length === 0 && (
        <div className="mt-8">
          <EmptyState title="Your cart is empty">
            Add a car from the <Link className="text-brand-400 underline" to="/cars">inventory</Link> to get started.
          </EmptyState>
        </div>
      )}

      {!loading && !error && cars && cars.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-3">
            {cars.map((car) => (
              <CartRow key={car.id} car={car} onRemove={remove} />
            ))}
          </ul>

          <div className="h-fit rounded-card bg-ink-850 p-5 shadow-card ring-1 ring-white/5">
            <h2 className="font-display text-lg font-bold text-white">Order summary</h2>
            <div className="mt-4 flex items-center justify-between text-sm text-ink-300">
              <span>{requestable.length} {requestable.length === 1 ? 'car' : 'cars'} ready to request</span>
              <span className="font-bold text-white">{formatCurrency(total)}</span>
            </div>

            {isAuthenticated ? (
              <Button
                fullWidth
                className="mt-5"
                disabled={requestable.length === 0}
                loading={checkingOut}
                onClick={handleCheckout}
              >
                Send purchase requests
              </Button>
            ) : (
              <Link
                to="/login"
                state={{ from: '/cart' }}
                className="mt-5 flex w-full items-center justify-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-paper hover:bg-brand-600"
              >
                Log in to buy
              </Link>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
