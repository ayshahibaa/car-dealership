const CENTER = 50;
const RADIUS = 30;
const LABEL_RADIUS = 42;
const RINGS = 4;

function pointAt(angle, r) {
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

const toPath = (pts) => pts.map((p) => p.join(',')).join(' ');

export default function RadarChart({ axes, series }) {
  const n = axes.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  const angleFor = (i) => startAngle + i * angleStep;

  const gridPolygons = Array.from({ length: RINGS }, (_, ring) => {
    const r = (RADIUS * (ring + 1)) / RINGS;
    return axes.map((_, i) => pointAt(angleFor(i), r));
  });

  const axisLines = axes.map((_, i) => pointAt(angleFor(i), RADIUS));

  const seriesPolygons = series.map((s) => ({
    ...s,
    points: s.values.map((v, i) => pointAt(angleFor(i), (Math.max(0, Math.min(100, v)) / 100) * RADIUS)),
  }));

  const labelPositions = axes.map((axis, i) => {
    const [x, y] = pointAt(angleFor(i), LABEL_RADIUS);
    return { ...axis, x, y };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-square w-full max-w-[22rem]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Radar chart comparing the selected cars">
          <defs>
            <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gridPolygons.map((pts, i) => (
            <polygon key={i} points={toPath(pts)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" />
          ))}
          {axisLines.map((p, i) => (
            <line key={i} x1={CENTER} y1={CENTER} x2={p[0]} y2={p[1]} stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" />
          ))}

          <g style={{ mixBlendMode: 'screen' }}>
            {seriesPolygons.map((s) => (
              <polygon key={s.name} points={toPath(s.points)} fill={s.color} fillOpacity="0.5" stroke="none" />
            ))}
          </g>

          {seriesPolygons.map((s) => (
            <polygon
              key={`${s.name}-glow`}
              points={toPath(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
              filter="url(#radarGlow)"
              opacity="0.75"
            />
          ))}
          {seriesPolygons.map((s) => (
            <polygon key={s.name} points={toPath(s.points)} fill="none" stroke={s.color} strokeWidth="1.1" strokeLinejoin="round" />
          ))}
          {seriesPolygons.map((s) => s.points.map((p, i) => <circle key={`${s.name}-${i}`} cx={p[0]} cy={p[1]} r="1.4" fill={s.color} />))}
        </svg>

        {labelPositions.map((pos) => (
          <span
            key={pos.label}
            className="absolute whitespace-nowrap rounded-full border border-white/25 bg-ink-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md sm:text-xs"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {pos.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {series.map((s) => (
          <span key={s.name} className="flex max-w-[12rem] items-center gap-1.5 text-sm text-ink-300">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
