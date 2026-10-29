import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Kbd } from './ui/Kbd';
import { GLOBAL_SHORTCUTS, NAV_CHORDS } from '../lib/shortcuts';

function Keys({ keys }: { keys: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.split(' ').map((k, i) =>
        k === '/' ? <span key={i} className="text-foreground-subtle">/</span> : <Kbd key={i}>{k}</Kbd>,
      )}
    </span>
  );
}

export default function KeyboardShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const navChords = NAV_CHORDS.filter((c) => !c.adminOnly || user?.role === 'ADMIN');
  const sections: { title: string; rows: { keys: string; label: string }[] }[] = [
    { title: 'Global', rows: GLOBAL_SHORTCUTS },
    { title: 'Navigate', rows: navChords },
  ];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div
        className="w-[520px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        data-testid="shortcuts-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          <button type="button" onClick={onClose} aria-label="close" className="text-foreground-muted hover:text-foreground">×</button>
        </div>
        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{s.title}</div>
              <div className="space-y-1.5">
                {s.rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-foreground">{r.label}</span>
                    <Keys keys={r.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
