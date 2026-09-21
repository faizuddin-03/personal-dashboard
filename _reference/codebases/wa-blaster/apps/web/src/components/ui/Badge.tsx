// Badge.tsx — token-driven status badge, translated from docs/design/components.jsx
import type { ReactNode, CSSProperties } from 'react';

export type BadgeTone = 'brand' | 'ai' | 'human' | 'success' | 'neutral' | 'blue' | 'amber' | 'red';

interface ToneTokens {
  bg: string;
  line: string;
  fg: string;
  solid: string;
}

const TONES: Record<BadgeTone, ToneTokens> = {
  brand:   { bg: 'var(--accent-fill)',         line: 'var(--green-200)',       fg: 'var(--accent-text)',   solid: 'var(--accent)' },
  ai:      { bg: 'rgba(124,92,252,0.10)',       line: 'rgba(124,92,252,0.20)', fg: '#7C5CFC',              solid: '#7C5CFC' },
  human:   { bg: 'rgba(245,158,11,0.10)',       line: 'rgba(245,158,11,0.20)', fg: 'var(--amber-500)',     solid: 'var(--amber-500)' },
  success: { bg: 'var(--green-50)',             line: 'var(--green-200)',       fg: 'var(--green-700)',     solid: 'var(--green-500)' },
  neutral: { bg: 'var(--bg-subtle)',            line: 'var(--border)',          fg: 'var(--text-muted)',    solid: 'var(--text-muted)' },
  blue:    { bg: 'var(--blue-50)',              line: 'rgba(59,130,246,0.20)', fg: 'var(--blue-500)',      solid: 'var(--blue-500)' },
  amber:   { bg: 'var(--amber-50)',             line: 'rgba(245,158,11,0.20)', fg: 'var(--amber-500)',     solid: 'var(--amber-500)' },
  red:     { bg: 'var(--red-50)',               line: 'rgba(239,68,68,0.20)',  fg: 'var(--red-500)',       solid: 'var(--red-500)' },
};

export interface BadgeProps {
  tone?: BadgeTone;
  solid?: boolean;
  icon?: ReactNode;
  mono?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  solid = false,
  icon,
  mono = false,
  className,
  style,
  children,
}: BadgeProps) {
  const t = TONES[tone] ?? TONES.neutral;

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 22,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    letterSpacing: mono ? '-0.01em' : '0.01em',
    fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
  };

  const skin: CSSProperties = solid
    ? { background: t.solid, color: '#fff' }
    : { background: t.bg, color: t.fg, border: `1px solid ${t.line}` };

  return (
    <span className={className} style={{ ...base, ...skin, ...style }}>
      {icon}
      {children}
    </span>
  );
}
