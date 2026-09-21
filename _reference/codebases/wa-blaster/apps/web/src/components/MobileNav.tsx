// MobileNav.tsx — mobile top bar (hamburger + brand) + sticky bottom tabs
// Visible only below 768 px via Tailwind utility classes.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AIOrb } from './ui/AIOrb';
import { BOTTOM_TABS, NAV } from '../lib/roles';
import {
  IcBar, IcMessage, IcUsers, IcFile,
} from './ui/icons';

// ── Icon map for bottom tabs ─────────────────────────────────────────────────

const TAB_ICON: Record<typeof BOTTOM_TABS[number], JSX.Element> = {
  Dashboard: <IcBar size={20} />,
  Inbox:     <IcMessage size={20} />,
  Dealers:   <IcUsers size={20} />,
  Templates: <IcFile size={20} />,
};

// ── Hamburger icon (3 bars) ──────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
    >
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface MobileNavProps {
  escalations?: number;
  inReview?: number;
  autoRate?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MobileNav({ escalations = 0, inReview = 0, autoRate }: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Bottom tab items: filter NAV to just the BOTTOM_TABS labels, preserving order
  const tabs = BOTTOM_TABS.map((label) => {
    const navItem = NAV.find((n) => n.label === label)!;
    return { label, path: navItem.path, icon: TAB_ICON[label], badge: navItem.badge };
  });

  return (
    // lg:hidden hides this entire block on large screens (≥ 1024 px)
    <div className="lg:hidden">
      {/* ── Mobile Top Bar ──────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 'var(--topbar-h)',
          padding: '0 16px',
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--bg)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
        }}
      >
        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            border: 0,
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <HamburgerIcon />
        </button>

        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            color: 'var(--text-heading)',
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'var(--green-500)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AIOrb size={22} />
          </span>
          <span style={{ fontWeight: 500, fontSize: 14 }}>eAuto</span>
        </div>
      </header>

      {/* ── Drawer scrim ────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.42)',
            zIndex: 70,
          }}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer (slide-in sidebar) ───────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-w)',
          maxWidth: '80vw',
          zIndex: 80,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(.3,.7,.4,1)',
        }}
      >
        <Sidebar
          collapsed={false}
          onToggleCollapse={() => setDrawerOpen(false)}
          escalations={escalations}
          inReview={inReview}
          autoRate={autoRate}
        />
      </div>

      {/* ── Bottom Tab Bar ──────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--bg)',
          borderTop: '0.5px solid var(--border)',
          zIndex: 60,
        }}
      >
        {tabs.map(({ label, path, icon, badge }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const badgeCount =
            badge === 'escalations' ? escalations :
            badge === 'inReview'    ? inReview    : 0;

          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              data-active={active || undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                position: 'relative',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                {icon}
                {badgeCount > 0 && (
                  <span
                    data-testid={badge === 'escalations' ? 'mobile-inbox-badge' : undefined}
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -6,
                      minWidth: 15,
                      height: 15,
                      borderRadius: 999,
                      background: 'var(--red-500)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: '15px',
                      textAlign: 'center',
                      padding: '0 3px',
                    }}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
