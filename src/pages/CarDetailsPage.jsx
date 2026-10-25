import { useState } from 'react';
import { Link, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import { Loader, ErrorMessage, EmptyState, SuccessMessage } from '../components/common/StatusMessage.jsx';
import Button from '../components/common/Button.jsx';
import PurchaseButton from '../components/cars/PurchaseButton.jsx';
import { IconCheck, IconHeart } from '../components/icons/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCarById, getMyPurchaseRequests } from '../services/carService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatMileage } from '../utils/formatMileage.js';
import { appConfig } from '../config/appConfig.js';

export default function CarDetailsPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const { data: car, loading, error } = useAsync(() => getCarById(id), [id]);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { isInCart, toggle: toggleCart, remove: removeFromCart } = useCart();
  const [requestSent, setRequestSent] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const { data: myRequests } = useAsync(
    () => (isAuthenticated ? getMyPurchaseRequests(token) : Promise.resolve(null)),
    [isAuthenticated, token, requestVersion],
  );
  const myRequestForCar = myRequests?.find((r) => r.vehicle?.id === id);

  function handleRequested() {
    setRequestSent(true);
    setRequestVersion((v) => v + 1);
    removeFromCart(id);
  }

  return (
    <PageContainer className="py-12">
      <Link to="/cars" className="text-sm text-ink-400 hover:text-white">← Back to cars</Link>

      {loading && <Loader label="Loading vehicle…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} /></div>}
      {!loading && !error && !car && (
        <div className="mt-6">
          <EmptyState title="Vehicle not found">
            This listing doesn’t exist or is no longer available. <Link className="text-brand-400 underline" to="/cars">Browse all cars</Link>.
          </EmptyState>
        </div>
      )}

      {car && (
        <article className="mt-6 grid gap-8 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-xl border border-white/10 bg-ink-850">
            <img src={car.images[0]?.src} alt={car.images[0]?.alt} className="aspect-video w-full object-cover" />
            {car.images[0]?.kind === 'illustration' && (
              <figcaption className="px-4 py-2 text-xs text-ink-400">{appConfig.demo.illustrationLabel}</figcaption>
            )}
          </figure>
          <div>
            <p className="text-sm text-ink-400">{car.stockNumber}</p>
            <h1 className="mt-1 text-3xl font-bold">{car.title}</h1>
            <p className="mt-4 text-3xl font-extrabold text-brand-400">{formatCurrency(car.price)}</p>
            <p className="mt-2 text-ink-300">{car.year} · {formatMileage(car.mileage)} · {car.fuelType ?? 'Fuel not specified'}</p>
            <div className="mt-6 flex max-w-xs flex-col gap-2">
              {myRequestForCar?.status === 'APPROVED' ? (
                <div className="rounded-md border border-success-600/50 bg-success-700/15 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <IconCheck className="h-4 w-4" /> You purchased this car
                  </p>
                  <Link to={`/orders/${myRequestForCar.id}`} className="mt-1 inline-block text-xs text-green-700 underline">
                    View your receipt
                  </Link>
                </div>
              ) : myRequestForCar?.status === 'PENDING' ? (
                <Button variant="secondary" disabled fullWidth>
                  <IconCheck className="h-4 w-4" /> Request sent — pending review
                </Button>
              ) : (
                <>
                  {myRequestForCar?.status === 'REJECTED' && (
                    <p className="text-xs text-ink-400">Your previous request for this car wasn't approved — you can send another.</p>
                  )}
                  <PurchaseButton car={car} onRequested={handleRequested} />
                </>
              )}
              <Button variant={isInCart(car.id) ? 'secondary' : 'outline'} fullWidth onClick={() => toggleCart(car.id)}>
                {isInCart(car.id) ? 'Remove from cart' : 'Add to cart'}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => toggleFavorite(car.id)}>
                <IconHeart className="h-4 w-4" filled={isFavorite(car.id)} />
                {isFavorite(car.id) ? 'Saved to favourites' : 'Save to favourites'}
              </Button>
            </div>
            {requestSent && (
              <div className="mt-4 max-w-xs">
                <SuccessMessage title="Request sent">
                  The Autoza team will review your request and contact you soon.
                </SuccessMessage>
              </div>
            )}
            <p className="mt-6 text-ink-300">{car.description}</p>
          </div>
        </article>
      )}
      <p className="mt-10 text-xs text-ink-500">Placeholder page — the full vehicle details page arrives in Phase 7.</p>
    </PageContainer>
  );
}
