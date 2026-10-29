// MessageBubble.tsx — shared bubble for both auto-reply and ticket threads
import { useState } from 'react';
import type { AutopilotEvent } from '../../api/autopilot';
import { Avatar, AIOrb, ConfidenceRing, Badge, IcCheckCircle } from '../ui';

export type BubbleSender = 'inbound' | 'outbound' | 'bot';

export interface BubbleMessage {
  id: string;
  body: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  /** Override to explicitly mark this as a bot message */
  isBot?: boolean;
}

export interface MessageBubbleProps {
  message: BubbleMessage;
  /** If provided, bubble is auditable — click to reveal audit card */
  auditEvent?: AutopilotEvent | null;
  /** Show "You" label vs contact name above bubble */
  agentName?: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({ message, auditEvent, agentName }: MessageBubbleProps) {
  const [auditOpen, setAuditOpen] = useState(false);
  const isBot = message.isBot === true;
  const isOutbound = message.direction === 'outbound';
  const isInbound = message.direction === 'inbound';

  // Visual alignment: outbound (agent/bot) goes right, inbound goes left
  const alignRight = isOutbound && !isBot;
  const alignLeft = isInbound || isBot;

  const bubbleBg = alignRight
    ? 'var(--accent)'
    : isBot
    ? 'rgba(124,92,252,0.08)'
    : 'var(--background)';

  const bubbleColor = alignRight ? '#fff' : 'var(--foreground)';
  const bubbleBorder = isBot ? '1px solid rgba(124,92,252,0.20)' : alignRight ? 'none' : '1px solid var(--border)';

  const body = message.body || '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignLeft ? 'flex-start' : 'flex-end',
        gap: 3,
      }}
    >
      {/* sender label */}
      {isBot && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10.5,
            fontWeight: 600,
            color: '#7C5CFC',
          }}
        >
          <AIOrb size={14} />
          Auto-reply AI
          <span
            style={{
              marginLeft: 2,
              padding: '1px 6px',
              borderRadius: 999,
              background: 'rgba(124,92,252,0.08)',
              border: '1px solid rgba(124,92,252,0.20)',
              fontSize: 9.5,
              fontWeight: 600,
            }}
          >
            Auto-sent
          </span>
        </span>
      )}
      {alignRight && !isBot && (
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>
          {agentName || 'You'}
        </span>
      )}

      {/* bubble */}
      <div
        onClick={() => auditEvent && setAuditOpen((o) => !o)}
        style={{
          maxWidth: '78%',
          padding: '9px 13px',
          borderRadius: 14,
          borderBottomRightRadius: alignRight ? 4 : 14,
          borderBottomLeftRadius: alignLeft ? 4 : 14,
          background: bubbleBg,
          color: bubbleColor,
          border: bubbleBorder,
          cursor: auditEvent ? 'pointer' : 'default',
          fontSize: 13.5,
          lineHeight: 1.5,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body}</div>
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            opacity: 0.6,
            textAlign: 'right',
            color: alignRight ? 'rgba(255,255,255,.85)' : 'var(--text-muted)',
          }}
        >
          {formatTime(message.timestamp)}
          {auditEvent && ' · tap to audit'}
        </div>
      </div>

      {/* audit card — shown when tapped */}
      {auditEvent && auditOpen && (
        <div
          style={{
            maxWidth: '92%',
            marginTop: 4,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <ConfidenceRing value={auditEvent.confidence ?? 0} size={46} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11.5, minWidth: 0 }}>
            {auditEvent.intent && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>Intent</span>
                <Badge tone="brand" mono>
                  {auditEvent.intent}
                </Badge>
              </div>
            )}
            {auditEvent.matchedKbSlug ? (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Matched </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7C5CFC', fontSize: 11 }}>
                  {auditEvent.matchedKbSlug}
                </span>
              </div>
            ) : (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Source </span>
                <span style={{ color: '#7C5CFC', fontSize: 11, fontWeight: 600 }}>RAG knowledge base</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {auditEvent.model && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {auditEvent.model}
                </span>
              )}
              <span style={{ color: 'var(--green-700, #15803d)', fontWeight: 600 }}>
                passed guardrails ✓
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Divider shown when AI escalated to a human */
export function EscalationDivider({ reason }: { reason?: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '4px 0',
        justifyContent: 'center',
      }}
    >
      <span style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.25)' }} />
      <Badge tone="human">
        AI escalated to a human{reason ? ` · ${reason}` : ''}
      </Badge>
      <span style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.25)' }} />
    </div>
  );
}

/** Footer shown in auto-replied threads */
export function ResolvedByAIFooter() {
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: 11.5,
        color: '#7C5CFC',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        marginTop: 4,
      }}
    >
      <IcCheckCircle size={14} />
      Resolved by AI — nothing needs you here
    </div>
  );
}

/** Contact's inbound message for ticket thread — alias for readability */
export { Avatar };
