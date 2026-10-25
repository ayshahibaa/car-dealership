import { Link } from 'react-router';
import { useCompare } from '../../context/CompareContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { getCarsByIds } from '../../services/carService.js';
import { buttonClasses } from '../../utils/buttonStyles.js';

export default function CompareBar() {
  const { ids, count, max, clear, remove } = useCompare();
  const { data: cars } = useAsync(() => (ids.length ? getCarsByIds(ids) : Promise.resolve([])), [ids.join(',')]);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-850/95 shadow-card backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center -space-x-2">
          {(cars ?? []).map((car) => (
            <button
              key={car.id}
              type="button"
              onClick={() => remove(car.id)}
              title={`Remove ${car.title}`}
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-ink-850 bg-ink-200 ring-1 ring-white/10"
            >
              <img src={car.images?.[0]?.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <p className="text-sm text-ink-300">
          <span className="font-semibold text-white">{count}</span> of {max} cars selected
          {count === 1 && <span className="hidden sm:inline"> — add one more to compare</span>}
        </p>

        <div className="ml-auto flex items-center gap-4">
          <button type="button" onClick={clear} className="text-sm font-semibold text-ink-300 hover:text-white">
            Clear
          </button>
          {count >= 2 ? (
            <Link to={`/compare?ids=${ids.join(',')}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Compare ({count})
            </Link>
          ) : (
            <span className={buttonClasses({ variant: 'primary', size: 'sm', className: 'cursor-not-allowed opacity-40' })} aria-disabled="true">
              Compare
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
