import {
  BADGE_PATH,
  BRAND_RED,
  CHEVRON_PATHS,
  LOGO_HEIGHT,
  LOGO_WIDTH,
  WORDMARK_GLYPHS,
  WORDMARK_TRANSFORM,
} from './logoPaths.js';

/**
 * Autoza logo as inline SVG (crisp at any size, no extra request).
 *
 * <Logo />                       full logo, white text (for dark backgrounds)
 * <Logo tone="dark" />           dark text (for light backgrounds)
 * <Logo variant="mark" />        badge only
 * className controls the size, e.g. "h-8 w-auto".
 */
export default function Logo({ variant = 'full', tone = 'light', className = 'h-8 w-auto', title = 'Autoza' }) {
  const textColor = tone === 'light' ? '#FFFFFF' : '#121417';
  const width = variant === 'mark' ? LOGO_HEIGHT : LOGO_WIDTH;

  return (
    <svg
      viewBox={`0 0 ${width} ${LOGO_HEIGHT}`}
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path d={BADGE_PATH} fill={BRAND_RED} />
      <path d={CHEVRON_PATHS[0]} fill="#FFFFFF" />
      <path d={CHEVRON_PATHS[1]} fill="#FFFFFF" fillOpacity="0.55" />
      {variant === 'full' && (
        <g transform={WORDMARK_TRANSFORM}>
          {WORDMARK_GLYPHS.map(([x, d], i) => (
            <path key={i} d={d} transform={`translate(${x} 0)`} fill={i >= 4 ? BRAND_RED : textColor} />
          ))}
        </g>
      )}
    </svg>
  );
}
