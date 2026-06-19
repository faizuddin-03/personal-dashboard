import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  listContacts,
  type DealerTier,
  type VehicleSpecialization,
  type OptInStatus,
} from '../api/contacts';
import { listSegments, createSegment } from '../api/segments';
import { useToast } from '../components/toast/ToastProvider';
import Pagination from '../components/Pagination';
import { Page, PageHead, Empty } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { Avatar, Tabs } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import {
  IcRefresh,
  IcSearch,
  IcX,
  IcInfo,
  IcPhone,
  IcChevR,
  IcPlus,
} from '../components/ui/icons';
import { useAuth } from '../auth/AuthContext';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';
import {
  TIER_LABELS,
  VEHICLE_LABELS,
  VEHICLE_ICONS,
  ALL_VEHICLE_SPECS,
} from '../lib/dealerLabels';
import AddDealerModal from '../components/AddDealerModal';

// ─── constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

type NumberTypeFilter = 'all' | 'PHONE' | 'LANE';

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string | string[] } } };
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m[0] ?? 'Something went wrong';
  return m ?? 'Something went wrong';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function fmtPhone(e164: string): string {
  // +60XXXXXXXXX → 0XX-XXXXXXX
  if (e164.startsWith('+60')) {
    const local = '0' + e164.slice(3);
    if (local.length >= 9) {
      const mid = local.length === 10 ? 2 : 3;
      return `${local.slice(0, mid + 1)}-${local.slice(mid + 1)}`;
    }
  }
  return e164;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TypePill({ type }: { type: string | null | undefined }) {
  if (type === 'LANE') {
    return (
      <Pill tone="amber">
        <IcPhone size={10} />
        Lane
      </Pill>
    );
  }
  return (
    <Pill tone="green">
      <IcPhone size={10} />
      Phone
    </Pill>
  );
}

function OptDot({ status }: { status: OptInStatus | undefined }) {
  const isIn = status === 'OPTED_IN';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isIn ? 'text-green-700' : 'text-red-500'}`}
    >
      <i className={`h-1.5 w-1.5 rounded-full ${isIn ? 'bg-green-600' : 'bg-red-500'}`} />
      {isIn ? 'opted in' : 'opted out'}
    </span>
  );
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex h-9 gap-0 rounded-[10px] border border-border bg-background-subtle p-[3px]">
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-[7px] border-none px-3 text-[13px] font-semibold transition-colors ${
            value === id
              ? 'bg-background text-foreground shadow-sm'
              : 'bg-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const PAGE_TABS = [
  { value: 'dealers' as const, label: 'All dealers' },
  { value: 'segments' as const, label: 'Segments' },
];

export default function Dealers() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';
  const navigate = useNavigate();

  // tab
  const [tab, setTab] = useState<'dealers' | 'segments'>('dealers');

  // add-dealer modal
  const [addOpen, setAddOpen] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState<NumberTypeFilter>('all');
  const [optF, setOptF] = useState<OptInStatus | ''>('');
  const [tierF, setTierF] = useState<DealerTier | ''>('');
  const [stateF, setStateF] = useState<MalaysianState | ''>('');
  const [langF, setLangF] = useState('');
  const [vehF, setVehF] = useState<VehicleSpecialization[]>([]);
  const [page, setPage] = useState(1);

  const toggleVeh = (v: VehicleSpecialization) =>
    setVehF((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  const activeFilterCount =
    (typeF !== 'all' ? 1 : 0) +
    (optF ? 1 : 0) +
    (tierF ? 1 : 0) +
    (stateF ? 1 : 0) +
    (langF ? 1 : 0) +
    vehF.length;

  function clearFilters() {
    setTypeF('all');
    setOptF('');
    setTierF('');
    setStateF('');
    setLangF('');
    setVehF([]);
    setPage(1);
  }

  // build query params
  const queryParams = useMemo(() => {
    const p: Parameters<typeof listContacts>[0] = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (search) p.search = search;
    if (typeF !== 'all') p.numberType = [typeF];
    if (optF) p.optInStatus = [optF];
    if (tierF) p.tier = [tierF];
    if (stateF) p.state = [stateF];
    if (langF) p.languagePreference = [langF as 'EN' | 'MS' | 'ZH'];
    if (vehF.length) p.vehicleSpecialization = vehF;
    return p;
  }, [search, typeF, optF, tierF, stateF, langF, vehF, page]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', queryParams],
    queryFn: () => listContacts(queryParams),
    placeholderData: (prev) => prev,
    enabled: tab === 'dealers',
  });

  const { data: segments, isLoading: segsLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: listSegments,
    enabled: tab === 'segments',
  });

  // ── multi-select + save-as-segment ──────────────────────────────────────────
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [segName, setSegName] = useState('');
  const [segDesc, setSegDesc] = useState('');
  const { showToast } = useToast();
  // selection is page-scoped: clear whenever the result set changes (filter/page/tab)
  useEffect(() => { setSelected(new Set()); setShowSaveForm(false); }, [queryParams, tab]);

  // selection helpers (depend on data)
  const pageIds = data?.items.map((c) => c.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(pageIds)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const saveSegMut = useMutation({
    mutationFn: () =>
      createSegment({
        name: segName.trim(),
        description: segDesc.trim() || undefined,
        filter: { contactIds: [...selected] },
      }),
    onSuccess: (seg) => {
      const count = selected.size;
      qc.invalidateQueries({ queryKey: ['segments'] });
      showToast(`Segment "${seg.name}" saved with ${count} dealers`);
      setSelected(new Set());
      setShowSaveForm(false);
      setSegName('');
      setSegDesc('');
    },
    onError: (e) => showToast(extractMessage(e), 'error'),
  });

  // blast eligibility banner computed from current page items
  const eligibleCount = useMemo(
    () =>
      data?.items?.filter(
        (c) => c.numberType === 'PHONE' && c.optInStatus === 'OPTED_IN',
      ).length ?? 0,
    [data],
  );
  const laneCount = useMemo(
    () => data?.items?.filter((c) => c.numberType === 'LANE').length ?? 0,
    [data],
  );

  return (
    <Page>
      <PageHead
        title="Dealers"
        titleTestId="dealers-heading"
        actions={
          !isOperator ? (
            <Button
              variant="primary"
              size="sm"
              icon={<IcPlus size={14} />}
              onClick={() => setAddOpen(true)}
              data-testid="add-dealer"
            >
              Add dealer
            </Button>
          ) : undefined
        }
      />

      {/* sync status banner */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground-muted">
          <IcRefresh size={14} className="text-accent" />
          Synced from core system · last sync 2 min ago
        </span>
        {isOperator && (
          <Pill tone="amber">View-only</Pill>
        )}
      </div>

      {/* tabs */}
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={PAGE_TABS}
        />
      </div>

      {/* ── Segments tab ── */}
      {tab === 'segments' && (
        <div>
          <p className="mb-3 text-[12.5px] text-foreground-muted">
            Saved, rule-based groups. Sizes update automatically as dealers sync.
          </p>
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            {segsLoading && (
              <p className="px-6 py-8 text-[13px] text-foreground-muted">Loading segments…</p>
            )}
            {!segsLoading && segments && segments.length === 0 && (
              <Empty
                title="No segments yet"
                body="Create a segment on the Segments page to see it here."
              />
            )}
            {!segsLoading && segments && segments.length > 0 && (
              <table className="w-full text-[13px]" data-testid="segments-table">
                <thead className="border-b border-border bg-background-subtle text-left text-[11px] text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3">Segment</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0" data-testid={`segment-row-${s.id}`}>
                      <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-foreground-muted">{s.description ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-foreground-muted">
                        {relativeTime(s.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<IcChevR size={13} />}
                          onClick={() => navigate('/blasts/new')}
                        >
                          Use
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── All dealers tab ── */}
      {tab === 'dealers' && (
        <>
          {/* toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            {/* search */}
            <div className="relative w-60">
              <IcSearch
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
              />
              <input
                type="search"
                placeholder="Search dealership, PIC or number"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-md border border-border-strong bg-background py-0 pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                data-testid="contacts-search"
              />
            </div>

            {/* type segmented control */}
            <SegmentedControl
              value={typeF}
              onChange={(v) => { setTypeF(v as NumberTypeFilter); setPage(1); }}
              options={[
                { id: 'all', label: 'All' },
                { id: 'PHONE', label: 'Phone' },
                { id: 'LANE', label: 'Lane' },
              ]}
            />

            {/* opt-in */}
            <select
              className="h-9 rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent"
              value={optF}
              onChange={(e) => { setOptF(e.target.value as OptInStatus | ''); setPage(1); }}
            >
              <option value="">All opt-in</option>
              <option value="OPTED_IN">Opted in</option>
              <option value="OPTED_OUT">Opted out</option>
            </select>

            {/* tier */}
            <select
              className="h-9 rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent"
              value={tierF}
              onChange={(e) => { setTierF(e.target.value as DealerTier | ''); setPage(1); }}
            >
              <option value="">All tiers</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>

            {/* state */}
            <select
              className="h-9 rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent"
              value={stateF}
              onChange={(e) => { setStateF(e.target.value as MalaysianState | ''); setPage(1); }}
            >
              <option value="">All states</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>{stateLabel(s)}</option>
              ))}
            </select>

            {/* language */}
            <select
              className="h-9 rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent"
              value={langF}
              onChange={(e) => { setLangF(e.target.value); setPage(1); }}
            >
              <option value="">All langs</option>
              <option value="EN">EN</option>
              <option value="MS">MS</option>
              <option value="ZH">ZH</option>
            </select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<IcX size={13} />}
                onClick={clearFilters}
              >
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>

          {/* specialization chips */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ALL_VEHICLE_SPECS.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vehF.includes(v)}
                onClick={() => { toggleVeh(v); setPage(1); }}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                  vehF.includes(v)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-strong bg-background text-foreground-muted hover:border-accent hover:text-foreground'
                }`}
              >
                {VEHICLE_ICONS[v]} {VEHICLE_LABELS[v]}
              </button>
            ))}
          </div>

          {/* blast eligibility banner */}
          {data && (
            <div className="mb-3 flex flex-wrap items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <IcInfo size={15} className="shrink-0 text-blue-500" />
              <span className="text-[13px]">
                <b className="text-green-700">{eligibleCount} of {data.total}</b>
                {' '}dealers are blast-eligible (mobile numbers).{' '}
                <span className="text-amber-600">{laneCount} office/fax lines</span>
                {' '}
                <span className="text-foreground-muted">are automatically excluded from blasts.</span>
              </span>
            </div>
          )}

          {/* table area */}
          {isLoading && (
            <p className="py-8 text-center text-[13px] text-foreground-muted">Loading dealers…</p>
          )}
          {error && (
            <p className="py-4 text-[13px] text-red-500">Failed to load dealers.</p>
          )}
          {data && (
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              {/* selection action bar */}
              {selected.size > 0 && (
                <div
                  className="m-3 flex flex-wrap items-center gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5"
                  data-testid="selection-bar"
                >
                  <span className="text-[13px] font-semibold text-foreground">{selected.size} selected</span>
                  {!showSaveForm ? (
                    <>
                      <Button size="sm" onClick={() => setShowSaveForm(true)} data-testid="save-as-segment">
                        Save as segment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                    </>
                  ) : (
                    <form
                      className="flex flex-wrap items-center gap-2"
                      onSubmit={(e) => { e.preventDefault(); if (segName.trim()) saveSegMut.mutate(); }}
                    >
                      <input autoFocus required value={segName} onChange={(e) => setSegName(e.target.value)}
                        placeholder="Segment name"
                        className="h-8 rounded-md border border-border-strong bg-background px-2 text-[13px] text-foreground outline-none focus:border-accent"
                        data-testid="segment-name-input" />
                      <input value={segDesc} onChange={(e) => setSegDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="h-8 w-48 rounded-md border border-border-strong bg-background px-2 text-[13px] text-foreground outline-none focus:border-accent" />
                      <Button size="sm" type="submit" disabled={!segName.trim() || saveSegMut.isPending}>
                        {saveSegMut.isPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" type="button"
                        onClick={() => { setShowSaveForm(false); setSegName(''); setSegDesc(''); }}>
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* row count header */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-foreground-muted">
                  <b className="text-foreground">{data.items.length}</b> of{' '}
                  <b className="text-foreground">{data.total}</b> dealers
                </span>
              </div>

              {data.items.length === 0 ? (
                <Empty
                  title="No dealers match"
                  body="Try clearing some filters to widen your search."
                  cta={
                    activeFilterCount > 0 ? (
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]" data-testid="contacts-table">
                    <thead className="border-b border-border bg-background-subtle text-left text-[11px] text-foreground-muted">
                      <tr>
                        <th className="w-10 px-4 py-3">
                          <input type="checkbox" aria-label="Select all on page"
                            ref={(el) => { if (el) el.indeterminate = selected.size > 0 && !allSelected; }}
                            checked={allSelected} onChange={toggleAll} data-testid="select-all" />
                        </th>
                        <th className="px-4 py-3">Dealership</th>
                        <th className="px-4 py-3">State</th>
                        <th className="px-4 py-3">Specialization</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Credits</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Last active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((c) => {
                        const tier = c.tier;
                        const tierLabel = tier ? TIER_LABELS[tier] : null;
                        const tierTone =
                          tier === 'GOLD'
                            ? 'brand'
                            : tier === 'SILVER' || tier === 'BRONZE'
                              ? 'neutral'
                              : 'neutral';
                        const vSpec = c.vehicleSpecialization;
                        const subStatus = c.subscriptionStatus;
                        const credits = c.historyCheckCredits ?? null;
                        const isLowCredits = credits !== null && credits < 30;

                        return (
                          <tr
                            key={c.id}
                            className="border-b border-border last:border-0 hover:bg-background-hover"
                            data-testid={`contact-row-${c.id}`}
                          >
                            <td className="px-4 py-3.5">
                              <input type="checkbox" aria-label={`Select ${c.name ?? c.phoneE164}`}
                                checked={selected.has(c.id)} onChange={() => toggleOne(c.id)}
                                data-testid={`select-${c.id}`} />
                            </td>

                            {/* Dealership */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={c.name ?? undefined} size="md" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-semibold text-foreground">
                                      {c.name ?? '—'}
                                    </span>
                                    {subStatus === 'LAPSED' && (
                                      <Badge tone="red" style={{ height: 17, fontSize: 10 }}>
                                        Lapsed
                                      </Badge>
                                    )}
                                    {subStatus === 'EXPIRING' && (
                                      <Badge tone="human" style={{ height: 17, fontSize: 10 }}>
                                        Expiring
                                      </Badge>
                                    )}
                                  </div>
                                  {(c.picName || c.picRole) && (
                                    <div className="mt-0.5 truncate text-[12px] text-foreground-muted">
                                      {[c.picName, c.picRole].filter(Boolean).join(' · ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* State */}
                            <td className="px-4 py-3.5 text-foreground">
                              {c.state ? stateLabel(c.state as MalaysianState) : '—'}
                            </td>

                            {/* Specialization */}
                            <td className="px-4 py-3.5">
                              {vSpec ? (
                                <span className="inline-flex items-center gap-1 text-[12.5px] text-foreground">
                                  {VEHICLE_ICONS[vSpec]} {VEHICLE_LABELS[vSpec]}
                                </span>
                              ) : (
                                <span className="text-foreground-subtle">—</span>
                              )}
                            </td>

                            {/* Tier */}
                            <td className="px-4 py-3.5">
                              {tierLabel ? (
                                <Badge tone={tierTone as 'brand' | 'neutral'}>
                                  {tierLabel}
                                </Badge>
                              ) : (
                                <span className="text-foreground-subtle">—</span>
                              )}
                            </td>

                            {/* Credits */}
                            <td className="px-4 py-3.5">
                              {credits !== null ? (
                                <span
                                  className={`font-mono text-[12.5px] font-semibold ${
                                    isLowCredits ? 'text-red-500' : 'text-foreground-muted'
                                  }`}
                                >
                                  {credits}
                                </span>
                              ) : (
                                <span className="text-foreground-subtle">—</span>
                              )}
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3.5">
                              <div className="flex min-w-[160px] flex-col gap-1">
                                <span
                                  className={`font-mono text-[12.5px] ${
                                    c.numberType === 'LANE'
                                      ? 'text-foreground-subtle'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {fmtPhone(c.phoneE164)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <TypePill type={c.numberType} />
                                  <OptDot status={c.optInStatus} />
                                </div>
                              </div>
                            </td>

                            {/* Last active */}
                            <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-foreground-muted">
                              {relativeTime(c.lastSeenAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-border px-4">
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  onPageChange={(p) => { setPage(p); }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <AddDealerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </Page>
  );
}
