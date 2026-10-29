import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Theme } from '../theme/useTheme';
import { NAV } from '../lib/roles';
import { ROLE_LABEL } from '../lib/roles';
import { Avatar } from './ui/Misc';
import { IconButton } from './ui/Button';
import { Pill } from './ui/Pill';
import {
  IcSearch, IcSun, IcMoon, IcLogout, IcHome, IcChevR, IcChevD,
  IcUser, IcSparkle, IcCheck, IcShield, IcHelp,
} from './ui/icons';
import { AIOrb } from './ui/AIOrb';
import { NotificationsBell } from './NotificationsBell';
import { NOTIFS_SEED } from '../lib/notifications';

// ── Breadcrumb path → label map ─────────────────────────────────────────────

const PATH_LABEL: Record<string, string> = {};
for (const item of NAV) {
  PATH_LABEL[item.path] = item.label;
}
// sub-paths: map to parent label
const SUB_PARENT: Record<string, string> = {
  '/blasts/new': 'Campaigns',
  '/contacts/import': 'Dealers',
};

function useBreadcrumb(): string {
  const { pathname } = useLocation();
  if (SUB_PARENT[pathname]) return SUB_PARENT[pathname];
  // Exact match
  if (PATH_LABEL[pathname]) return PATH_LABEL[pathname];
  // Prefix match (longest wins)
  let best = '';
  let bestLen = 0;
  for (const [p, label] of Object.entries(PATH_LABEL)) {
    if (p !== '/' && pathname.startsWith(p) && p.length > bestLen) {
      best = label;
      bestLen = p.length;
    }
  }
  return best || 'eAuto';
}

// ── AI ambient widget ────────────────────────────────────────────────────────

function AIWidget({ autoRate = 78 }: { autoRate?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 10px',
        background: 'var(--bg-subtle)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <AIOrb size={18} breathe />
      <span>AI is handling things</span>
      <Pill tone="green" dot>{autoRate}%</Pill>
    </div>
  );
}

// ── User-menu dropdown ───────────────────────────────────────────────────────

interface UserMenuProps {
  theme: Theme;
  onToggleTheme: () => void;
}

function UserMenu({ theme, onToggleTheme }: UserMenuProps) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<'appearance' | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = () => { setOpen(false); setSubmenu(null); };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) { close(); }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); triggerRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    close();
    try { await logout(); } finally { navigate('/login'); }
  }

  async function handleSwitchRole() {
    close();
    if (user?.role === 'ADMIN') {
      await login('support@example.com', 'ChangeMe123!');
    } else {
      await login('admin@example.com', 'ChangeMe123!');
    }
  }

  const switchLabel = user?.role === 'ADMIN'
    ? `Switch to ${ROLE_LABEL['OPERATOR']}`
    : `Switch to ${ROLE_LABEL['ADMIN']}`;

  const displayName = user?.name || user?.email || '';
  const roleLabel = user?.role ? ROLE_LABEL[user.role] : '';

  const themeOptions: { id: Theme; label: string; icon: JSX.Element }[] = [
    { id: 'light', label: 'Light',  icon: <IcSun size={14} /> },
    { id: 'dark',  label: 'Dark',   icon: <IcMoon size={14} /> },
  ];

  const items = useMemo(() => [
    {
      id: 'profile', label: 'My profile', icon: <IcUser size={16} />,
      action: () => { navigate('/settings'); close(); },
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: theme === 'dark' ? <IcMoon size={16} /> : <IcSun size={16} />,
      hasSubmenu: true,
      action: () => setSubmenu((s) => (s === 'appearance' ? null : 'appearance')),
    },
    {
      id: 'switch-role', label: switchLabel, icon: <IcShield size={16} />,
      action: handleSwitchRole,
    },
    { id: 'div1', divider: true },
    {
      id: 'signout', label: 'Sign out', icon: <IcLogout size={16} />, destructive: true,
      action: handleLogout,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [theme, submenu, user?.role, switchLabel]);

  return (
    <button
      ref={triggerRef}
      className="usermenu"
      data-open={open ? 'true' : 'false'}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      title="Account menu"
    >
      <Avatar name={displayName} size="md" />
      <div className="who">
        <span className="name" data-testid="current-user">{user?.email}</span>
        <span className="role">{roleLabel}</span>
      </div>
      <IcChevD size={12} className="chev" />

      {open && (
        <div ref={dropdownRef} className="um-dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="um-header">
            <Avatar name={displayName} size="lg" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="who-name">{displayName}</div>
              <div className="who-email">{user?.email}</div>
              <div className="who-pill" style={{ marginTop: 6 }}>
                <Pill tone={user?.role === 'ADMIN' ? 'blue' : 'gray'}>
                  {roleLabel}
                </Pill>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="um-list">
            {items.map((it) => {
              if ('divider' in it && it.divider) {
                return <div key={it.id} className="um-divider" />;
              }
              const isAppearanceOpen = it.id === 'appearance' && submenu === 'appearance';
              const isSignout = it.id === 'signout';
              return (
                <div key={it.id}>
                  <button
                    className="um-item"
                    data-active="false"
                    data-destructive={isSignout ? 'true' : 'false'}
                    role="menuitem"
                    onClick={it.action}
                    {...(isSignout ? { 'data-testid': 'logout' } : {})}
                  >
                    <span className="um-icon">{'icon' in it ? it.icon : null}</span>
                    <span className="um-label">{'label' in it ? it.label : ''}</span>
                    {'hasSubmenu' in it && it.hasSubmenu && (
                      <IcChevD
                        size={12}
                        style={{
                          color: 'var(--text-muted)',
                          transform: isAppearanceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.12s',
                        }}
                      />
                    )}
                  </button>
                  {isAppearanceOpen && (
                    <div className="um-sub">
                      {themeOptions.map((t) => (
                        <button
                          key={t.id}
                          className="um-sub-item"
                          data-active={t.id === theme ? 'true' : 'false'}
                          onClick={() => { onToggleTheme(); close(); }}
                        >
                          <span style={{ color: 'var(--text-muted)', display: 'inline-flex', marginRight: 8 }}>
                            {t.icon}
                          </span>
                          <span>{t.label}</span>
                          <span className="check"><IcCheck size={14} /></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
}

// ── TopBar ───────────────────────────────────────────────────────────────────

export default function TopBar({
  onSearchOpen,
  theme,
  onToggleTheme,
  onHelpOpen,
}: {
  onSearchOpen: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onHelpOpen: () => void;
}) {
  const navigate = useNavigate();
  const title = useBreadcrumb();
  const [notifItems, setNotifItems] = useState(NOTIFS_SEED);

  return (
    <header className="topbar">
      {/* Breadcrumb */}
      <div className="crumbs">
        <IcHome size={13} style={{ color: 'var(--text-subtle)' }} />
        <IcChevR size={11} className="crumb-sep" />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>eAuto</span>
        <IcChevR size={11} className="crumb-sep" />
        <span className="crumb-cur">{title}</span>
      </div>

      {/* Search */}
      <button
        type="button"
        className="search"
        onClick={onSearchOpen}
        style={{ border: '0.5px solid var(--border)', cursor: 'text' }}
      >
        <IcSearch size={14} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search contacts, campaigns, templates…</span>
        <span className="kbd">⌘K</span>
      </button>

      <span className="grow" />

      {/* Topbar actions */}
      <div className="topbar-actions">
        {/* AI ambient widget */}
        <AIWidget />

        {/* Keyboard shortcuts help */}
        <IconButton icon={<IcHelp size={16} />} title="Keyboard shortcuts" onClick={onHelpOpen} data-testid="help-button" />

        {/* Theme toggle */}
        <IconButton
          icon={theme === 'dark' ? <IcSun size={16} /> : <IcMoon size={16} />}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
        />

        {/* Notifications */}
        <NotificationsBell
          items={notifItems}
          onChange={setNotifItems}
          onNavigate={(screen) => {
            const screenToPath: Record<string, string> = {
              inbox: '/inbox',
              templates: '/templates',
              campaigns: '/blasts',
              contacts: '/contacts',
            };
            const path = screenToPath[screen];
            if (path) navigate(path);
          }}
        />

        <span style={{ width: 0.5, height: 22, background: 'var(--border)' }} />

        {/* User menu */}
        <UserMenu theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </header>
  );
}
