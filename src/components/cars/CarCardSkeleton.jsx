export default function CarCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-ink-850 shadow-card ring-1 ring-white/5" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-ink-700" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink-700" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-ink-700" />
        <div className="h-4 w-full animate-pulse rounded bg-ink-700" />
        <div className="mt-1 h-9 w-full animate-pulse rounded-md bg-ink-700" />
      </div>
    </div>
  );
}

export function CarCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading cars">
      {Array.from({ length: count }, (_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}
