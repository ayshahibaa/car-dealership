/** Shared loading / error / empty messages so every page handles them the same way. */
export function Loader({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex items-center gap-3 py-12 text-ink-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-600 border-t-brand-500" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorMessage({ error, title = 'Something went wrong' }) {
  return (
    <div role="alert" className="rounded-lg border border-brand-600/50 bg-brand-700/15 p-4 text-sm text-brand-300">
      <p className="font-semibold">{title}</p>
      {error?.message && <p className="mt-1 text-ink-300">{error.message}</p>}
    </div>
  );
}

/** Same shape as ErrorMessage, in the site's success colour — confirms an action actually completed. */
export function SuccessMessage({ title, children }) {
  return (
    <div role="status" className="rounded-lg border border-success-600/50 bg-success-700/15 p-4 text-sm text-green-300">
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 text-ink-300">{children}</p>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-600 p-10 text-center">
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-400">{children}</div>}
    </div>
  );
}
