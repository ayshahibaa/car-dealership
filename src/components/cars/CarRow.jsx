import { Link } from 'react-router';
import CarCard from './CarCard.jsx';
import { CarCardSkeletonGrid } from './CarCardSkeleton.jsx';
import { ErrorMessage, EmptyState } from '../common/StatusMessage.jsx';
import { IconChevronRight } from '../icons/index.jsx';

/**
 * A titled row of CarCards for the homepage (featured / recent). Handles its
 * own loading / error / empty states so HomePage just passes a fetch result.
 * Favouriting and the cart are both handled inside CarCard itself (via
 * FavoritesContext / CartContext), so this row doesn't need to know about
 * either.
 */
export default function CarRow({ title, subtitle, viewAllHref, cars, loading, error, skeletonCount = 4 }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-ink-400">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-300 sm:flex"
          >
            View all <IconChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-6">
        {loading && <CarCardSkeletonGrid count={skeletonCount} />}
        {error && <ErrorMessage error={error} title="Could not load these cars" />}
        {!loading && !error && cars?.length === 0 && (
          <EmptyState title="No cars to show yet">Check back soon — new listings are added regularly.</EmptyState>
        )}
        {!loading && !error && cars?.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>

      {viewAllHref && (
        <Link to={viewAllHref} className="mt-6 flex items-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-300 sm:hidden">
          View all <IconChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
