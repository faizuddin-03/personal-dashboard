import type { ReactNode } from 'react';

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1440px] p-8 max-[1100px]:p-6 max-[720px]:p-4">{children}</div>;
}

export function PageHead({ title, subtitle, actions, titleTestId, titleAs = 'h1' }:
  { title: string; subtitle?: string; actions?: ReactNode; titleTestId?: string; titleAs?: 'h1' | 'h2' }) {
  const Title = titleAs;
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <Title className="text-2xl font-medium tracking-tight text-heading" data-testid={titleTestId}>{title}</Title>
        {subtitle && <div className="mt-1 text-[13px] text-foreground-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = '' }:
  { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-background ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            {title && <div className="text-sm font-medium text-foreground">{title}</div>}
            {subtitle && <div className="text-xs text-foreground-muted">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Empty({ icon, title, body, cta }:
  { icon?: ReactNode; title: string; body?: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 grid h-11 w-11 place-items-center rounded-lg bg-background-hover text-foreground-muted">{icon}</div>}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {body && <div className="max-w-xs text-[13px] text-foreground-muted">{body}</div>}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-background-hover ${className}`} />;
}
