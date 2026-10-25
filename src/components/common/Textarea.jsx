import { useId } from 'react';

export default function Textarea({ label, error, hint, id, className = '', rows = 4, ...rest }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-200">
          {label}
          {rest.required && <span className="text-brand-400"> *</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-ink-850 px-3 py-2.5 text-white placeholder:text-ink-500 focus:outline-none focus:ring-2 ${
          error ? 'border-brand-500 focus:ring-brand-500/40' : 'border-white/15 focus:border-brand-500 focus:ring-brand-500/40'
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-brand-400">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
