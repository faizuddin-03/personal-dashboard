import type { ReactNode } from 'react';

export type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  gray: 'bg-transparent text-foreground border-border-strong',
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-50 text-amber-500 border-amber-500/30',
  red: 'bg-red-50 text-red-500 border-red-500/30',
  blue: 'bg-blue-50 text-blue-500 border-blue-500/30',
};

export function Pill({ tone = 'gray', dot, icon, children, ...rest }:
  { tone?: Tone; dot?: boolean; icon?: ReactNode; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`} {...rest}>
      {dot && <i className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {icon}{children}
    </span>
  );
}

// status -> tone (covers TemplateStatus + BlastStatus)
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'gray', PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', DISABLED: 'gray',
  SCHEDULED: 'blue', RUNNING: 'amber', COMPLETED: 'green', CANCELED: 'gray', FAILED: 'red',
};

export function StatusPill({ status, testId }: { status: string; testId?: string }) {
  return <Pill tone={STATUS_TONE[status] ?? 'gray'} dot data-testid={testId}>{status}</Pill>;
}
