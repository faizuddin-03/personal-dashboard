import type { ReactNode } from 'react';

export function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const letters = (name || '?').split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  const dim = size === 'sm' ? 'h-5 w-5 text-[9px]' : size === 'lg' ? 'h-9 w-9 text-[13px]' : 'h-7 w-7 text-[11px]';
  return <span className={`grid shrink-0 place-items-center rounded-full bg-accent font-medium text-white ${dim}`}>{letters}</span>;
}

export function Tabs<T extends string>({ value, onChange, tabs }:
  { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-5 border-b border-border">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px flex h-9 items-center gap-2 border-b-2 text-[13px] ${
            value === t.value ? 'border-accent font-medium text-foreground' : 'border-transparent text-foreground-muted hover:text-foreground'}`}>
          {t.label}{t.count != null && <span className="text-[11px] text-foreground-subtle">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-foreground-subtle/40'}`}>
      <i className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${on ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Stat({ label, value, foot }: { label: ReactNode; value: ReactNode; foot?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-6">
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">{label}</div>
      <div className="text-2xl font-medium tabular-nums tracking-tight text-foreground">{value}</div>
      {foot && <div className="flex items-center gap-1.5 text-xs text-foreground-muted">{foot}</div>}
    </div>
  );
}

export function Progress({ value, max = 100, testId }: { value: number; max?: number; testId?: string }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-background-hover" data-testid={testId}>
      <i className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${p}%` }} />
    </div>
  );
}
