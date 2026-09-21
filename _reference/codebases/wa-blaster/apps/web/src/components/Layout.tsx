import { ReactNode, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import CommandPalette from './CommandPalette';
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';
import { AssistantPanel } from './assistant/AssistantPanel';
import { AIOrb } from './ui/AIOrb';
import { useTheme } from '../theme/useTheme';
import { isTyping } from '../lib/shortcuts';
import { useInboxUnreadCount } from '../hooks/useInboxUnreadCount';
import { useGlobalNavShortcuts } from '../hooks/useGlobalNavShortcuts';
import { listTemplates } from '../api/templates';

export default function Layout({ children }: { children: ReactNode }) {
  useGlobalNavShortcuts();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // ── Badge counts ──────────────────────────────────────────────────────────
  // getInboxUnreadCount returns { count: number }
  const { data: inboxData } = useInboxUnreadCount();
  const escalations = inboxData?.count ?? 0;

  const { data: pendingTemplates } = useQuery({
    queryKey: ['templates', 'pending'],
    queryFn: () => listTemplates({ status: ['PENDING'] }),
  });
  const inReview = pendingTemplates?.length ?? 0;

  // Static auto-handled rate (design intent: 78 %)
  const autoRate = 78;

  useEffect(() => { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); setAssistantOpen((v) => !v); }
      if (e.key === '?' && !isTyping(e.target)) { e.preventDefault(); setHelpOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app" data-sidebar={collapsed ? 'collapsed' : 'expanded'}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        escalations={escalations}
        inReview={inReview}
        autoRate={autoRate}
      />

      {/* Desktop top bar — hidden on mobile via CSS */}
      <TopBar onSearchOpen={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggle} onHelpOpen={() => setHelpOpen(true)} />

      <main className="main">
        <div className="page">{children}</div>
      </main>

      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        aria-label="Open campaign assistant"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg hover:opacity-90"
      >
        <AIOrb size={26} breathe />
      </button>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <KeyboardShortcutsOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Mobile nav (hamburger drawer + bottom tabs) — hidden on desktop via Tailwind lg:hidden */}
      <MobileNav escalations={escalations} inReview={inReview} autoRate={autoRate} />
    </div>
  );
}
