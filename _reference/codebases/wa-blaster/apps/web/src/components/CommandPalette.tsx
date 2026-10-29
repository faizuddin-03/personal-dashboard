import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type Cmd = { id: string; label: string; to: string; admin?: boolean };

const COMMANDS: Cmd[] = [
  // Navigation — mirrors NAV in roles.ts
  { id: 'nav-dashboard',   label: 'Go to Dashboard',   to: '/' },
  { id: 'nav-campaigns',   label: 'Go to Campaigns',   to: '/blasts' },
  { id: 'nav-inbox',       label: 'Go to Inbox',        to: '/inbox' },
  { id: 'nav-dealers',     label: 'Go to Dealers',      to: '/contacts' },
  { id: 'nav-templates',   label: 'Go to Templates',    to: '/templates' },
  { id: 'nav-performance', label: 'Go to Performance',  to: '/reports' },
  { id: 'nav-knowledge',   label: 'Go to Knowledge',    to: '/knowledge', admin: true },
  { id: 'nav-settings',    label: 'Go to Settings',     to: '/settings',  admin: true },
  // Actions
  { id: 'act-new-campaign',   label: 'New campaign',    to: '/blasts/new' },
  { id: 'act-new-template',   label: 'New template',    to: '/templates/new' },
  { id: 'act-add-dealer',     label: 'Add dealer',      to: '/contacts/new' },
  { id: 'act-import-dealers', label: 'Import dealers',  to: '/contacts/import' },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);

  const items = useMemo(() => {
    const visible = COMMANDS.filter((c) => !c.admin || user?.role === 'ADMIN');
    const ql = q.trim().toLowerCase();
    return ql ? visible.filter((c) => c.label.toLowerCase().includes(ql)) : visible;
  }, [q, user]);

  useEffect(() => { if (!open) { setQ(''); setCursor(0); } }, [open]);
  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
      else if (e.key === 'Enter') { const it = items[cursor]; if (it) { navigate(it.to); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, cursor, navigate, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div className="w-[600px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        role="dialog" aria-modal="true" aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none" />
        <div className="max-h-[380px] overflow-y-auto py-1">
          {items.map((it, i) => (
            <button key={it.id} onMouseEnter={() => setCursor(i)} onClick={() => { navigate(it.to); onClose(); }}
              className={`flex w-full items-center px-4 py-2 text-left text-[13px] ${i === cursor ? 'bg-background-subtle text-foreground' : 'text-foreground'}`}>
              {it.label}
            </button>
          ))}
          {items.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-foreground-muted">No matches</div>}
        </div>
      </div>
    </div>
  );
}
