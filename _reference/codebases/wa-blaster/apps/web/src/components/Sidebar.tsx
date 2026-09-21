import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { visibleNav } from '../lib/roles';
import {
  IcBar, IcSend, IcMessage, IcUsers, IcFile, IcActivity, IcBook, IcSettings,
  IcChevsLR, IcChevsRL,
} from './ui/icons';
import { AIOrb } from './ui/AIOrb';
import type { ComponentType, SVGProps } from 'react';

// ── Icon lookup keyed by NavItem.icon string ─────────────────────────────────
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ICON_MAP: Record<string, IconComponent> = {
  IcBar,
  IcSend,
  IcMessage,
  IcUsers,
  IcFile,
  IcActivity,
  IcBook,
  IcSettings,
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Inbox escalations count — renders badge when > 0. */
  escalations?: number;
  /** Templates in-review count — renders badge when > 0. */
  inReview?: number;
  /** % of conversations auto-handled today. Defaults to 78 when undefined. */
  autoRate?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar({
  collapsed,
  onToggleCollapse,
  escalations = 0,
  inReview = 0,
  autoRate,
}: SidebarProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const nav = visibleNav(user?.role);

  const displayAutoRate = autoRate !== undefined ? autoRate : 78;

  return (
    <aside className="sidebar">
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <AIOrb size={30} breathe />
        </span>
        {!collapsed && (
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">WhatsApp Blaster</span>
            <span className="sidebar-brand-env">eAuto</span>
          </span>
        )}
      </div>

      {/* ── Primary nav ───────────────────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Workspace</div>
        <div className="sidebar-nav">
          {nav.map((item) => {
            const active =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path);

            const IconComp = ICON_MAP[item.icon];

            // Determine badge count for this item
            let badgeCount: number | undefined;
            if (item.badge === 'escalations') badgeCount = escalations;
            else if (item.badge === 'inReview') badgeCount = inReview;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="nav-item"
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                data-active={active || undefined}
              >
                {IconComp ? <IconComp size={18} /> : null}
                <span className="nav-label">{item.label}</span>
                {item.badge === 'escalations' && badgeCount != null && badgeCount > 0 && (
                  <span className="nav-badge" data-tone="human" data-testid="sidebar-inbox-badge">
                    {badgeCount}
                  </span>
                )}
                {item.badge === 'inReview' && badgeCount != null && badgeCount > 0 && (
                  <span className="nav-badge">{badgeCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── AI ambient presence (expanded only) ───────────────────────────── */}
      {!collapsed && (
        <div className="sidebar-ai-ambient">
          <div className="ai-ambient-header">
            <AIOrb size={26} breathe />
            <div className="ai-ambient-info">
              <span className="ai-ambient-title">Auto-reply AI</span>
              <span className="ai-ambient-status">Running autonomously</span>
            </div>
          </div>
          <div className="ai-ambient-stat">
            <span className="label">Auto-handled today</span>
            <span className="value">{displayAutoRate}%</span>
          </div>
        </div>
      )}

      {/* ── Footer / collapse toggle ───────────────────────────────────────── */}
      <div className="sidebar-foot">
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IcChevsLR size={14} /> : <IcChevsRL size={14} />}
          {!collapsed && <span className="label">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
