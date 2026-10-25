/** A round icon-only button (favourite toggle, close button, etc.). */
export default function IconButton({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={rest['aria-pressed'] ?? active}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        active ? 'bg-brand-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
