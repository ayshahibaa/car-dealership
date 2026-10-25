import { buttonClasses } from '../../utils/buttonStyles.js';

/**
 * <Button>Save</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 * <Button loading>Submitting…</Button>
 *
 * For a link that should look like a button, use buttonClasses() directly
 * with react-router's <Link> (see CarCard's "View details").
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={rest.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
