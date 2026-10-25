import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import { Loader, ErrorMessage, EmptyState } from '../components/common/StatusMessage.jsx';
import CarCard from '../components/cars/CarCard.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { getCarsByIds } from '../services/carService.js';

/** Favourited cars, persisted via FavoritesContext (localStorage) — see CarCard's heart icon. */
export default function FavoritesPage() {
  const { ids } = useFavorites();
  const { data: cars, loading, error } = useAsync(
    () => (ids.length ? getCarsByIds(ids) : Promise.resolve([])),
    [ids.join(',')],
  );

  return (
    <PageContainer className="py-12">
      <h1 className="text-3xl font-bold">Favourites</h1>

      {loading && <Loader label="Loading your favourites…" />}
      {error && <div className="mt-6"><ErrorMessage error={error} title="Could not load your favourites" /></div>}

      {!loading && !error && cars && cars.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No favourites yet">
            Cars you save will appear here. <Link className="text-brand-400 underline" to="/cars">Browse cars</Link>.
          </EmptyState>
        </div>
      )}

      {!loading && !error && cars && cars.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
