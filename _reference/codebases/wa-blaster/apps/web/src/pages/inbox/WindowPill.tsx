import { Pill } from '../../components/ui';

function formatHoursLeft(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.floor(ms / (60 * 1000));
  return `${Math.max(minutes, 1)}m left`;
}

export function WindowPill({ windowExpiresAt, windowOpen }: {
  windowExpiresAt: string | null;
  windowOpen: boolean;
}) {
  if (windowOpen) {
    return (
      <Pill tone="green" data-testid="inbox-window-pill">
        {formatHoursLeft(windowExpiresAt)}
      </Pill>
    );
  }
  return (
    <Pill tone="amber" data-testid="inbox-window-pill">
      Window closed
    </Pill>
  );
}
