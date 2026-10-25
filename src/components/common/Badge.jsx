const TONES = {
  neutral: 'bg-ink-700 text-ink-200',
  brand: 'bg-brand-500/15 text-brand-600 ring-1 ring-inset ring-brand-500/30',
  success: 'bg-success-500/15 text-green-700 ring-1 ring-inset ring-success-500/30',
  warning: 'bg-warning-500/15 text-amber-700 ring-1 ring-inset ring-warning-500/30',
  danger: 'bg-brand-500/15 text-brand-600 ring-1 ring-inset ring-brand-500/30',
  dark: 'bg-black/60 text-paper backdrop-blur-sm',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}
