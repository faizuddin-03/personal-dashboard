// NotificationsBell.tsx — bell button with unread badge + dropdown panel
// Translated from docs/design/shell.jsx notification patterns

import { useState, useEffect, useRef } from 'react';
import type { Notif } from '../lib/notifications';
import { IcBell, IcCheckCircle, IcAlert, IcSparkle, IcX } from './ui/icons';

// ── icon resolver (maps icon string names to components) ───────────────────

function NotifIcon({ name, tone }: { name: string; tone: string }) {
  const colorMap: Record<string, string> = {
    amber:   'var(--amber-500)',
    success: 'var(--green-600)',
    brand:   'var(--accent)',
    red:     'var(--red-500)',
    ai:      '#7C5CFC',
    neutral: 'var(--text-muted)',
  };
  const color = colorMap[tone] ?? colorMap.neutral;
  const size = 14;
  if (name === 'checkCircle') return <IcCheckCircle size={size} style={{ color }} />;
  if (name === 'alert')       return <IcAlert       size={size} style={{ color }} />;
  if (name === 'sparkle')     return <IcSparkle     size={size} style={{ color }} />;
  if (name === 'x')           return <IcX           size={size} style={{ color }} />;
  return <IcBell size={size} style={{ color }} />;
}

// ── tone → dot colour ──────────────────────────────────────────────────────

function ToneDot({ tone }: { tone: string }) {
  const colorMap: Record<string, string> = {
    amber:   'var(--amber-500)',
    success: 'var(--green-500)',
    brand:   'var(--accent)',
    red:     'var(--red-500)',
    ai:      '#7C5CFC',
    neutral: 'var(--text-muted)',
  };
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colorMap[tone] ?? colorMap.neutral,
        flexShrink: 0,
        marginTop: 3,
      }}
    />
  );
}

// ── props ──────────────────────────────────────────────────────────────────

export interface NotificationsBellProps {
  items: Notif[];
  onChange?: (items: Notif[]) => void;
  onNavigate?: (screen: string) => void;
}

// ── component ──────────────────────────────────────────────────────────────

export function NotificationsBell({ items: itemsProp, onChange, onNavigate }: NotificationsBellProps) {
  // Use internal state seeded from props; caller can override via `onChange`
  const [items, setItems] = useState<Notif[]>(itemsProp);
  const [open, setOpen] = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync when parent updates items
  useEffect(() => { setItems(itemsProp); }, [itemsProp]);

  const unread = items.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        dropRef.current    && !dropRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open]);

  function update(next: Notif[]) {
    setItems(next);
    onChange?.(next);
  }

  function markAllRead() {
    update(items.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    update(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function handleClick(n: Notif) {
    markRead(n.id);
    if (n.screen) onNavigate?.(n.screen);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        className="icon-btn"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative' }}
      >
        <IcBell size={18} />
        {unread > 0 && (
          <span className="notif-unread-dot" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div ref={dropRef} className="notif-dropdown" role="dialog" aria-label="Notifications">
          {/* Header */}
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  className="notif-item"
                  data-unread={!n.read ? 'true' : 'false'}
                  onClick={() => handleClick(n)}
                  title={n.screen ? `Go to ${n.screen}` : undefined}
                >
                  <span className="notif-icon-wrap">
                    <NotifIcon name={n.icon} tone={n.tone} />
                  </span>
                  <span className="notif-body">
                    <span className="notif-text">{n.text}</span>
                    <span className="notif-time">{n.time}</span>
                  </span>
                  {!n.read && <ToneDot tone={n.tone} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
