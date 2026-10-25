import PageContainer from './PageContainer.jsx';

const TONES = {
  dark: 'bg-ink-900',
  darker: 'bg-ink-950',
  panel: 'bg-ink-850',
  light: 'bg-ink-50 text-ink-900',
};

export default function Section({ tone = 'dark', className = '', containerClassName = '', children }) {
  return (
    <section className={`${TONES[tone] ?? TONES.dark} ${className}`}>
      <PageContainer className={`py-12 sm:py-16 ${containerClassName}`}>{children}</PageContainer>
    </section>
  );
}
