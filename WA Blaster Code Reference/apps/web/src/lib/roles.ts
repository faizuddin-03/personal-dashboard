import type { Role } from '../api/auth';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Super Admin',
  OPERATOR: 'Customer Support',
};

export interface NavItem {
  label: string;       // visible text (E2E asserts these)
  path: string;        // existing route path (unchanged)
  icon: string;        // icon component name from components/ui/icons
  adminOnly?: boolean; // hidden for OPERATOR
  badge?: 'escalations' | 'inReview';
}

/** eAuto primary nav — new labels, existing paths (transitional). */
export const NAV: NavItem[] = [
  { label: 'Dashboard',   path: '/',          icon: 'IcBar' },
  { label: 'Campaigns',   path: '/blasts',    icon: 'IcSend' },
  { label: 'Inbox',       path: '/inbox',     icon: 'IcMessage', badge: 'escalations' },
  { label: 'Dealers',     path: '/contacts',  icon: 'IcUsers' },
  { label: 'Templates',   path: '/templates', icon: 'IcFile', badge: 'inReview' },
  { label: 'Performance', path: '/reports',   icon: 'IcActivity' },
  { label: 'Knowledge',   path: '/knowledge', icon: 'IcBook', adminOnly: true },
  { label: 'Settings',    path: '/settings',  icon: 'IcSettings', adminOnly: true },
];

export const isAdmin = (role: Role | undefined): boolean => role === 'ADMIN';

export const visibleNav = (role: Role | undefined): NavItem[] =>
  NAV.filter((n) => !n.adminOnly || isAdmin(role));

/** Mobile bottom-tab subset (labels must match NAV). */
export const BOTTOM_TABS = ['Dashboard', 'Inbox', 'Dealers', 'Templates'] as const;
