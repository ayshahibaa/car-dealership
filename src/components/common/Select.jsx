import { useId } from 'react';

/**
 * <Select label="Body type" value={v} onChange={...} options={[{value:'suv', label:'SUV'}]} />
 * `options` items can also be plain strings. A leading `placeholder` renders as a disabled option.
 */
export default function Select({ label, error, options = [], placeholder, id, className = '', ...rest }) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink-200">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        className={`w-full rounded-md border bg-ink-850 px-3 py-2.5 text-white focus:outline-none focus:ring-2 ${
          error ? 'border-brand-500 focus:ring-brand-500/40' : 'border-white/15 focus:border-brand-500 focus:ring-brand-500/40'
        }`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const { value, label: optLabel } = typeof opt === 'string' ? { value: opt, label: opt } : opt;
          return (
            <option key={value} value={value}>
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1.5 text-sm text-brand-400">{error}</p>}
    </div>
  );
}
