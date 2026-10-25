import PageContainer from './PageContainer.jsx';

const TONES = {
  dark: 'bg-ink-900',
  darker: 'bg-ink-950',
  panel: 'bg-ink-850',
  light: 'bg-ink-50 text-ink-900',
};

/**
 * A full-width page section with consistent vertical rhythm. Pages alternate
 * `tone` (dark / darker / panel / light) the way the reference design does,
 * so scrolling the homepage reads as a sequence of distinct bands.
 */
export default function Section({ tone = 'dark', className = '', containerClassName = '', children }) {
  return (
    <section className={`${TONES[tone] ?? TONES.dark} ${className}`}>
      <PageContainer className={`py-12 sm:py-16 ${containerClassName}`}>{children}</PageContainer>
    </section>
  );
}
