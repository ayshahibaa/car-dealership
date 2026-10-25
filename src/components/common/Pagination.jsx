import { IconChevronRight } from '../icons/index.jsx';

function pageWindow(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withGaps = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) withGaps.push('…');
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
}

const navBtn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        className={`${navBtn} text-ink-300 hover:bg-white/10 hover:text-white`}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <IconChevronRight className="h-4 w-4 rotate-180" />
        <span className="sr-only">Previous page</span>
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1.5 text-ink-500">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
            className={`${navBtn} ${p === page ? 'bg-brand-500 text-paper' : 'text-ink-300 hover:bg-white/10 hover:text-white'}`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className={`${navBtn} text-ink-300 hover:bg-white/10 hover:text-white`}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <IconChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </button>
    </nav>
  );
}
