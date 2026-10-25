export default function IconButton({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={rest['aria-pressed'] ?? active}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        active ? 'bg-brand-500 text-paper' : 'bg-black/50 text-paper hover:bg-black/70'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
