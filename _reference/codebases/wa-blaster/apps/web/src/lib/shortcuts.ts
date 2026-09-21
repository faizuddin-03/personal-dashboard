export interface NavChord { keys: string; label: string; path: string; adminOnly?: boolean }

// Dealers uses `e` (pEoplE) since `d` = Dashboard. No collisions across the 8 nav items.
export const NAV_CHORDS: NavChord[] = [
  { keys: 'g d', label: 'Dashboard', path: '/' },
  { keys: 'g c', label: 'Campaigns', path: '/blasts' },
  { keys: 'g i', label: 'Inbox', path: '/inbox' },
  { keys: 'g e', label: 'Dealers', path: '/contacts' },
  { keys: 'g t', label: 'Templates', path: '/templates' },
  { keys: 'g r', label: 'Performance', path: '/reports' },
  { keys: 'g k', label: 'Knowledge', path: '/knowledge', adminOnly: true },
  { keys: 'g s', label: 'Settings', path: '/settings', adminOnly: true },
];

export const GLOBAL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '⌘ K', label: 'Open command palette' },
  { keys: '?', label: 'Show keyboard shortcuts' },
];

export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
