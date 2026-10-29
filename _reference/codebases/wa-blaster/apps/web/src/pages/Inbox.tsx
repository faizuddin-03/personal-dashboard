// Inbox.tsx — dual-mode inbox: Auto-replied (AI audit) + Needs Human (ticket queue)
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Page, PageHead, AIOrb, IcAlert } from '../components/ui';
import { listAutopilotEvents } from '../api/autopilot';
import { listTickets } from '../api/tickets';
import { AutoRepliedMode } from './inbox/AutoRepliedMode';
import { NeedsHumanMode } from './inbox/NeedsHumanMode';

type Mode = 'auto' | 'needs';

export default function Inbox() {
  // optional deep-link param (for pre-selection, forwarded to the mode component)
  useParams<{ contactId?: string }>();

  const [mode, setMode] = useState<Mode>('needs');

  // Counts for the mode toggle
  const { data: autoEvents = [] } = useQuery({
    queryKey: ['autopilot', 'events', 'AUTO_REPLIED'],
    queryFn: () => listAutopilotEvents({ action: 'AUTO_REPLIED' }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const { data: activeTickets = [] } = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: () => listTickets({ tab: 'active' }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  // Count unique contactIds for auto mode
  const autoCount = new Set(autoEvents.map((e) => e.contactId)).size;
  const needsCount = activeTickets.length;

  return (
    <Page>
      <PageHead
        title="Inbox"
        subtitle="Replies from your dealers, in one place."
      />

      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 0 14px 0',
          borderBottom: '1px solid var(--border)',
          marginBottom: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setMode('auto')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            height: 32,
            padding: '0 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            background: mode === 'auto' ? 'rgba(124,92,252,0.08)' : 'transparent',
            borderColor: mode === 'auto' ? 'rgba(124,92,252,0.20)' : 'transparent',
            color: mode === 'auto' ? '#7C5CFC' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
        >
          <AIOrb size={16} />
          Auto-replied
          <span
            style={{
              opacity: 0.75,
              fontWeight: mode === 'auto' ? 700 : 500,
              fontSize: 12,
            }}
          >
            {autoCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode('needs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            height: 32,
            padding: '0 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            background: mode === 'needs' ? 'rgba(245,158,11,0.10)' : 'transparent',
            borderColor: mode === 'needs' ? 'rgba(245,158,11,0.20)' : 'transparent',
            color: mode === 'needs' ? 'var(--amber-500, #f59e0b)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
        >
          <IcAlert size={15} />
          Needs Human
          {needsCount > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: 'var(--amber-500, #f59e0b)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {needsCount}
            </span>
          )}
        </button>
      </div>

      {/* 3-pane layout */}
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 220px)',
          overflow: 'hidden',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--background)',
          marginTop: 0,
        }}
      >
        {mode === 'auto' ? <AutoRepliedMode /> : <NeedsHumanMode />}
      </div>
    </Page>
  );
}
