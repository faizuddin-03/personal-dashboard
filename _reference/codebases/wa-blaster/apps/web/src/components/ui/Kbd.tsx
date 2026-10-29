import { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-background-subtle px-1.5 py-0.5 font-mono text-[11px] text-foreground-muted">
      {children}
    </kbd>
  );
}
