/**
 * buttonStyles.js — one class-name builder shared by <Button> and anything
 * that needs to LOOK like a button but can't be one (e.g. a react-router
 * <Link> styled as a button). Keeps every button on the site consistent.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-ink-700 text-white hover:bg-ink-600 active:bg-ink-500',
  outline: 'border border-white/20 text-white hover:bg-white/10 active:bg-white/15',
  ghost: 'text-ink-200 hover:bg-white/10 active:bg-white/15',
  danger: 'bg-brand-700 text-white hover:bg-brand-600',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className = '' } = {}) {
  return [BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

export const BUTTON_VARIANTS = Object.keys(VARIANTS);
export const BUTTON_SIZES = Object.keys(SIZES);
