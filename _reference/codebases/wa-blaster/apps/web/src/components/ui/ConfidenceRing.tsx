// ConfidenceRing.tsx — SVG circular progress ring, translated from docs/design/components.jsx

export interface ConfidenceRingProps {
  /** 0..1 confidence value */
  value: number;
  size?: number;
}

type RingTone = 'green' | 'amber' | 'red';

interface ToneTokens {
  solid: string;
  fg: string;
}

const TONES: Record<RingTone, ToneTokens> = {
  green: { solid: 'var(--accent)',       fg: 'var(--accent-text)' },
  amber: { solid: 'var(--amber-500)',    fg: 'var(--amber-500)' },
  red:   { solid: 'var(--red-500)',      fg: 'var(--red-500)' },
};

function toneFor(value: number): RingTone {
  if (value >= 0.8) return 'green';
  if (value >= 0.55) return 'amber';
  return 'red';
}

export function ConfidenceRing({ value, size = 44 }: ConfidenceRingProps) {
  const pct = Math.round(value * 100);
  const tone = TONES[toneFor(value)];
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Confidence ${pct}%`}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--bg-subtle, #f1f5f9)"
          strokeWidth={4}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone.solid}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.26,
          fontWeight: 700,
          color: tone.fg,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '-0.02em',
        }}
      >
        {pct}
      </span>
    </div>
  );
}
