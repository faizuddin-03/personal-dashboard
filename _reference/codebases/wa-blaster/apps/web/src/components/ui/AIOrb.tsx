// AIOrb.tsx — glowing AI presence orb, translated from docs/design/components.jsx
import type { CSSProperties } from 'react';
import { IcSparkle } from './icons';

export interface AIOrbProps {
  size?: number;
  breathe?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AIOrb({ size = 24, breathe = false, className, style }: AIOrbProps) {
  const cls = ['ai-orb', breathe ? 'breathe' : '', className].filter(Boolean).join(' ');
  const iconSize = Math.round(size * 0.56);
  return (
    <span
      className={cls}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <IcSparkle size={iconSize} style={{ color: '#fff' }} strokeWidth={2.2} />
    </span>
  );
}
