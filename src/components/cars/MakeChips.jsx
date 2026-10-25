import { useState } from 'react';

const VISIBLE_COUNT = 8;

export default function MakeChips({ makes, activeMake, onSelect }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...makes].sort((a, b) => b.count - a.count);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_COUNT);
  const hasMore = sorted.length > VISIBLE_COUNT;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map(({ value, count }) => {
        const active = activeMake === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? '' : value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-brand-500 bg-brand-500 text-paper'
                : 'border-white/15 bg-white/5 text-ink-200 hover:border-brand-500 hover:bg-brand-500/10 hover:text-brand-600'
            }`}
          >
            {value} <span className={active ? 'text-paper/80' : 'text-ink-400'}>({count})</span>
          </button>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="rounded-full px-3 py-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
        >
          {showAll ? 'View less' : `View more (${sorted.length - VISIBLE_COUNT})`}
        </button>
      )}
    </div>
  );
}
