import { Link } from 'react-router';
import Badge from '../common/Badge.jsx';
import IconButton from '../common/IconButton.jsx';
import PurchaseButton from './PurchaseButton.jsx';
import { IconCalendar, IconCart, IconCheck, IconCompare, IconFuel, IconGauge, IconGear, IconHeart } from '../icons/index.jsx';
import { buttonClasses } from '../../utils/buttonStyles.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatMileage } from '../../utils/formatMileage.js';
import { appConfig } from '../../config/appConfig.js';
import { useCompare } from '../../context/CompareContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

/**
 * The listing card used on the homepage, inventory grid and "similar cars".
 *
 * Favouriting and the cart both read straight from their own contexts
 * (localStorage-backed — see FavoritesContext.jsx / CartContext.jsx), the
 * same way the compare toggle already reads from CompareContext: every
 * CarCard shares one site-wide selection, so a page never has to wire up
 * its own favourite/cart state (that was the bug — InventoryPage tracked
 * favourites itself, in memory, and the homepage didn't track them at all,
 * so the heart only ever showed up on one page and never survived a refresh).
 */
export default function CarCard({ car, className = '' }) {
  const { isSelected, toggle, isFull } = useCompare();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { isInCart, toggle: toggleCart } = useCart();
  const comparing = isSelected(car.id);
  const favorite = isFavorite(car.id);
  const inCart = isInCart(car.id);
  const soldOut = (car.quantity ?? 1) <= 0 || car.listingStatus === 'sold';
  const image = car.images?.[0];
  const specs = [
    { icon: IconCalendar, label: `${car.year}` },
    { icon: IconGauge, label: formatMileage(car.mileage, { fallback: 'Mileage unknown' }) },
    car.fuelType && { icon: IconFuel, label: car.fuelType },
    car.transmission && { icon: IconGear, label: car.transmission },
  ].filter(Boolean);

  return (
    <article className={`group flex flex-col overflow-hidden rounded-card bg-ink-850 shadow-card ring-1 ring-white/5 ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-200">
        <Link to={`/cars/${car.id}`} tabIndex={-1} aria-hidden="true">
          <img
            src={image?.src}
            alt={image?.alt ?? car.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {image?.kind === 'illustration' && (
          <Badge tone="dark" className="absolute left-2.5 top-2.5">{appConfig.demo.illustrationLabel}</Badge>
        )}
        <IconButton
          active={favorite}
          onClick={() => toggleFavorite(car.id)}
          aria-label={favorite ? `Remove ${car.title} from favourites` : `Add ${car.title} to favourites`}
          className="absolute right-2.5 top-2.5"
        >
          <IconHeart className="h-4 w-4" filled={favorite} />
        </IconButton>
        <IconButton
          active={comparing}
          disabled={!comparing && isFull}
          onClick={() => toggle(car.id)}
          aria-label={comparing ? `Remove ${car.title} from comparison` : `Add ${car.title} to comparison`}
          className={`absolute bottom-2.5 left-2.5 ${!comparing && isFull ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <IconCompare className="h-4 w-4" />
        </IconButton>
        <IconButton
          active={inCart}
          disabled={!inCart && soldOut}
          onClick={() => toggleCart(car.id)}
          aria-label={inCart ? `Remove ${car.title} from cart` : `Add ${car.title} to cart`}
          className={`absolute bottom-2.5 right-2.5 ${!inCart && soldOut ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <IconCart className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/cars/${car.id}`} className="line-clamp-2 font-display text-base font-semibold text-white hover:text-brand-300">
          {car.title}
        </Link>

        <p className="mt-1.5 text-xl font-bold text-brand-400">{formatCurrency(car.price)}</p>

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-ink-300">
          {specs.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-ink-400" />
              {label}
            </li>
          ))}
        </ul>

        {car.accidentHistory === 'none-reported' && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-400">
            <IconCheck className="h-3.5 w-3.5" /> No accidents reported
          </p>
        )}

        <Link to={`/cars/${car.id}`} className={buttonClasses({ variant: 'outline', size: 'sm', fullWidth: true, className: 'mt-4' })}>
          View details
        </Link>
        <PurchaseButton car={car} size="sm" className="mt-2" />
      </div>
    </article>
  );
}
