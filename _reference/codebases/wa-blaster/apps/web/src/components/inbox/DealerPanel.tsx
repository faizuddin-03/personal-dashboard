// DealerPanel.tsx — dealer context side panel, translated from docs/design/screen-inbox.jsx
import { useQuery } from '@tanstack/react-query';
import { getContact } from '../../api/contacts';
import type {
  Contact,
  DealerTier,
  SubscriptionStatus,
  VehicleSpecialization,
} from '../../api/contacts';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Misc';

// ---- label helpers ----

function tierLabel(tier?: DealerTier | null): string {
  if (!tier) return '—';
  const MAP: Record<DealerTier, string> = {
    GOLD: 'Gold',
    SILVER: 'Silver',
    BRONZE: 'Bronze',
  };
  return MAP[tier] ?? tier;
}

function subLabel(status?: SubscriptionStatus | null): string {
  if (!status) return '—';
  const MAP: Record<SubscriptionStatus, string> = {
    ACTIVE: 'Active',
    EXPIRING: 'Expiring',
    LAPSED: 'Lapsed',
  };
  return MAP[status] ?? status;
}

function vehicleLabel(spec?: VehicleSpecialization | null): string {
  if (!spec) return '—';
  const MAP: Record<VehicleSpecialization, string> = {
    NATIONAL: 'National',
    CONTINENTAL_LUXURY: 'Continental/Luxury',
    SUV_MPV: 'SUV/MPV',
    COMMERCIAL_PICKUP: 'Commercial/Pickup',
    EV_HYBRID: 'EV / Hybrid',
    MOTORCYCLE: 'Motorcycle',
    MULTI_BRAND: 'Multi-brand',
  };
  return MAP[spec] ?? spec;
}

function langLabel(lang?: string | null): string {
  if (!lang) return '—';
  const MAP: Record<string, string> = {
    EN: 'English',
    MS: 'Bahasa Malaysia',
    ZH: 'Mandarin',
    TA: 'Tamil',
    OTHER: 'Other',
  };
  return MAP[lang] ?? lang;
}

function fmtPhone(phone?: string | null): string {
  if (!phone) return '—';
  // e.g. +60123456789 → +601 2345 6789
  return phone.replace(/(\+\d{2})(\d{2})(\d{4})(\d+)/, '$1$2 $3 $4');
}

function fmtMYR(amount?: number | null): string {
  if (amount == null) return '—';
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---- sub-components ----

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--border)',
        margin: 0,
      }}
    />
  );
}

// ---- main component ----

export interface DealerPanelProps {
  contactId: string | null;
}

export function DealerPanel({ contactId }: DealerPanelProps) {
  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contacts', contactId],
    queryFn: () => getContact(contactId!),
    enabled: !!contactId,
  });

  // empty shell when no contact selected
  if (!contactId) {
    return (
      <aside
        style={{
          width: 260,
          flex: 'none',
          borderLeft: '1px solid var(--border)',
          background: 'var(--background)',
          padding: '22px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      />
    );
  }

  // loading skeleton
  if (isLoading || !contact) {
    return (
      <aside
        style={{
          width: 260,
          flex: 'none',
          borderLeft: '1px solid var(--border)',
          background: 'var(--background)',
          padding: '22px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[60, 14, 12, 4].map((h, i) => (
          <div
            key={i}
            className="skel"
            style={{ height: h, borderRadius: 6, width: i === 0 ? 60 : '100%', alignSelf: i === 0 ? 'center' : undefined }}
          />
        ))}
      </aside>
    );
  }

  const tier = contact.tier ?? null;
  const sub = contact.subscriptionStatus ?? null;
  const tierTone = tier === 'GOLD' ? 'brand' : 'neutral';
  const subTone = sub === 'ACTIVE' ? 'success' : sub === 'LAPSED' ? 'red' : 'human';
  const credits = contact.historyCheckCredits ?? null;
  const isOptedIn = contact.optInStatus === 'OPTED_IN';

  return (
    <aside
      style={{
        width: 260,
        flex: 'none',
        borderLeft: '1px solid var(--border)',
        background: 'var(--background)',
        padding: '22px 18px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* identity block */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 8,
        }}
      >
        <Avatar name={contact.name ?? undefined} size="lg" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{contact.name ?? '—'}</div>
          {(contact.picName || contact.picRole) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {[contact.picName, contact.picRole].filter(Boolean).join(' · ')}
            </div>
          )}
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-subtle)',
              marginTop: 3,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.01em',
            }}
          >
            {fmtPhone(contact.phoneE164)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tier && <Badge tone={tierTone}>{tierLabel(tier)}</Badge>}
          {sub && <Badge tone={subTone}>{subLabel(sub)}</Badge>}
        </div>
      </div>

      <Divider />

      {/* data rows */}
      <Row label="State">{contact.state ?? '—'}</Row>

      <Row label="Specialization">{vehicleLabel(contact.vehicleSpecialization)}</Row>

      <Row label="Language">{langLabel(contact.languagePreference)}</Row>

      <Row label="Check credits">
        {credits != null ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: credits < 30 ? 'var(--amber-500)' : 'inherit',
              fontWeight: credits < 30 ? 700 : 500,
            }}
          >
            {credits}
          </span>
        ) : (
          '—'
        )}
      </Row>

      <Row label="Transfers / 30d">
        {contact.transfers30d != null ? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{contact.transfers30d}</span>
        ) : (
          '—'
        )}
      </Row>

      <Row label="Lifetime spend">{fmtMYR(contact.lifetimeSpend)}</Row>

      <Row label="Opt-in">
        {isOptedIn ? (
          <Badge tone="success">Opted in</Badge>
        ) : (
          <Badge tone="red">Opted out</Badge>
        )}
      </Row>
    </aside>
  );
}
