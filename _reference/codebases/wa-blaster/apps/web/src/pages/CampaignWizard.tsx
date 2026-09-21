/**
 * CampaignWizard — 3-step compose wizard (eAuto design)
 *
 * Step 1 — Audience: state + specialization chips → audienceFilter
 * Step 2 — Template: family grid + language delivery (PREFERENCE | STATE)
 *           → protected state→language coverage + gap blocker
 * Step 3 — Review: name, schedule (now | later), summary → createBlast
 *
 * Preserves all data-testid values from BlastWizard.tsx so existing E2E
 * specs continue to target the same selectors.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listTemplates, type Template } from '../api/templates';
import { listContacts } from '../api/contacts';
import {
  createBlast,
  previewStateLanguages,
  type CreateBlastInput,
  type BlastLanguageMode,
  type ContactFilter,
} from '../api/blasts';
import type { LanguagePreference, VehicleSpecialization } from '../api/contacts';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';
import { Page, PageHead } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { DealerPicker } from '../components/DealerPicker';

// ─── helpers ─────────────────────────────────────────────────────────────────

const VEHICLE_OPTIONS: { value: VehicleSpecialization; label: string }[] = [
  { value: 'NATIONAL',          label: '🇲🇾 National' },
  { value: 'CONTINENTAL_LUXURY', label: '🌍 Continental/Luxury' },
  { value: 'SUV_MPV',           label: '🚙 SUV/MPV' },
  { value: 'COMMERCIAL_PICKUP', label: '🚛 Commercial/Pickup' },
  { value: 'EV_HYBRID',         label: '⚡ EV/Hybrid' },
  { value: 'MOTORCYCLE',        label: '🏍️ Motorcycle' },
  { value: 'MULTI_BRAND',       label: '🏪 Multi-brand' },
];

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English', MS: 'Malay', ZH: 'Chinese', TA: 'Tamil', OTHER: 'Other',
};

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/** Format a datetime-local string for display. */
function fmtSchedule(value: string): { friendly: string; review: string } | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return {
    friendly: `${wd}, ${day} ${mon} ${year} · ${time} (MYT)`,
    review:   `${day} ${mon} ${year}, ${time}`,
  };
}

/** Default "now + 1 day at 9:00" for the schedule picker. */
function defaultSchedule(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}

// ─── shared input style (matches design system) ───────────────────────────────

const inputCls =
  'w-full h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground ' +
  'placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent ' +
  'disabled:opacity-50';

// ─── chip component ────────────────────────────────────────────────────────────

function Chip({
  on, onClick, children,
}: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium',
        'transition-colors cursor-pointer whitespace-nowrap',
        on
          ? 'border-accent bg-accent text-white'
          : 'border-border-strong bg-background text-foreground hover:bg-background-hover',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ─── stepper ──────────────────────────────────────────────────────────────────

const STEPS = ['Audience', 'Template', 'Review'] as const;

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex gap-3 mb-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1.5">
          <div
            className="h-1 rounded-full transition-colors duration-300"
            style={{ background: i <= step ? 'var(--accent)' : 'var(--bg-subtle, #f1f5f9)' }}
          />
          <span
            className="text-[11.5px] font-medium"
            style={{ color: i <= step ? 'var(--text)' : 'var(--text-muted)' }}
          >
            {i + 1}. {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── step 1: audience ──
  const [selectedStates, setSelectedStates]         = useState<MalaysianState[]>([]);
  const [selectedVehicles, setSelectedVehicles]     = useState<VehicleSpecialization[]>([]);
  // Choose the audience either by filter (state/specialization) or by hand-picking dealers.
  const [audienceMode, setAudienceMode]             = useState<'filter' | 'manual'>('filter');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // ── step 2: template + language delivery ──
  // A template may be pre-selected via ?template=<name> (e.g. "Start blast" from a template).
  const [templateName, setTemplateName]             = useState(searchParams.get('template') ?? '');
  const [defaultLanguage, setDefaultLanguage]       = useState<LanguagePreference>('EN');
  const [languageMode, setLanguageMode]             = useState<BlastLanguageMode>('PREFERENCE');

  // ── step 3: review ──
  const [name, setName]                             = useState('');
  const [when, setWhen]                             = useState<'now' | 'later'>('now');
  const [schedAt, setSchedAt]                       = useState(defaultSchedule);
  const [schedErr, setSchedErr]                     = useState('');
  const [error, setError]                           = useState<string | null>(null);

  // ── wizard step ──
  const [step, setStep]                             = useState(0);

  // ─── build audienceFilter ─────────────────────────────────────────────────

  const audienceFilter: ContactFilter =
    audienceMode === 'manual'
      ? { contactIds: selectedContactIds, optInStatus: ['OPTED_IN'], numberType: ['PHONE'] }
      : {
          ...(selectedStates.length ? { state: selectedStates } : {}),
          ...(selectedVehicles.length ? { vehicleSpecialization: selectedVehicles } : {}),
          optInStatus: ['OPTED_IN'],
          numberType: ['PHONE'],
        };

  // ─── query: audience estimate (step 1) ────────────────────────────────────

  const {
    data: audienceData,
    isFetching: audienceFetching,
  } = useQuery({
    queryKey: ['campaign-audience', selectedStates, selectedVehicles],
    queryFn: () => listContacts({ ...audienceFilter, pageSize: 1 }),
    enabled: audienceMode === 'filter',
    staleTime: 15_000,
  });
  const audienceCount =
    audienceMode === 'manual' ? selectedContactIds.length : audienceData?.total ?? 0;

  // ─── query: approved templates (step 2) ───────────────────────────────────

  const { data: templates } = useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => listTemplates({ status: ['APPROVED'] }),
  });

  // Group by name → families
  const templateGroups: Record<string, Template[]> = {};
  for (const t of templates ?? []) {
    (templateGroups[t.name] ??= []).push(t);
  }
  const familyNames = Object.keys(templateGroups);

  const selectedGroup   = templateName ? templateGroups[templateName] : undefined;
  const availableLanguages = selectedGroup?.map((t) => t.language) ?? [];
  const variables          = selectedGroup?.[0]?.variables ?? [];

  // When the selected template changes, reset defaultLanguage to first available language.
  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(defaultLanguage)) {
      setDefaultLanguage(availableLanguages[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateName]);

  // ─── query: state-language preview (step 2, STATE mode) ───────────────────

  const {
    data: preview,
    isFetching: previewFetching,
  } = useQuery({
    queryKey: ['campaign-preview', templateName, defaultLanguage, selectedStates, selectedVehicles, audienceMode, selectedContactIds],
    queryFn: () =>
      previewStateLanguages({
        templateName,
        defaultLanguage,
        audienceFilter,
      }),
    enabled: languageMode === 'STATE' && !!templateName,
    staleTime: 15_000,
  });

  const hasGaps = languageMode === 'STATE' && (preview?.gaps.length ?? 0) > 0;

  // ─── can-continue guards ──────────────────────────────────────────────────

  const canContinueStep0 = audienceCount > 0;
  const canContinueStep1 = !!templateName && !hasGaps;
  const schedValid = when === 'now' || (!!schedAt && new Date(schedAt).getTime() > Date.now());

  // ─── variable mapping (optional) ─────────────────────────────────────────

  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});

  // ─── submit ───────────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: createBlast,
    onSuccess: (blast) => navigate(`/blasts/${blast.id}`),
    onError:   (e: unknown) => setError(extractMessage(e)),
  });

  function handleSubmit() {
    setError(null);

    if (when === 'later' && !schedValid) {
      setSchedErr('Pick a future date and time');
      return;
    }
    setSchedErr('');

    const scheduledAt =
      when === 'now'
        ? new Date().toISOString()
        : new Date(schedAt).toISOString();

    const input: CreateBlastInput = {
      name:             name.trim() || templateName,
      templateName,
      defaultLanguage,
      audienceFilter,
      variableMapping,
      scheduledAt,
      languageMode,
    };
    create.mutate(input);
  }

  // ─── schedule validation on change ───────────────────────────────────────

  useEffect(() => {
    if (when === 'later' && schedAt) {
      setSchedErr(new Date(schedAt).getTime() > Date.now() ? '' : 'Pick a future date and time');
    } else {
      setSchedErr('');
    }
  }, [when, schedAt]);

  // ─── step navigation ──────────────────────────────────────────────────────

  function goNext() {
    if (step < 2) setStep((s) => s + 1);
  }
  function goBack() {
    if (step > 0) setStep((s) => s - 1);
    else navigate('/blasts');
  }

  // ─── summary helpers ─────────────────────────────────────────────────────

  const sched       = when === 'later' ? fmtSchedule(schedAt) : null;
  const audienceDesc =
    audienceMode === 'manual'
      ? `${selectedContactIds.length} hand-picked dealer${selectedContactIds.length === 1 ? '' : 's'}`
      : [
          selectedStates.length  ? selectedStates.map(stateLabel).join(', ') : 'All states',
          selectedVehicles.length ? selectedVehicles.join(', ')               : 'All specializations',
        ].join(' · ');
  const recipientDesc =
    languageMode === 'STATE' && preview
      ? `${preview.uniqueContacts} dealers · ${preview.totalMessages} messages`
      : `${audienceCount.toLocaleString()} dealers`;

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <Page>
      <PageHead title="New campaign" />

      <div className="mx-auto max-w-2xl">
        <div
          className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
          data-testid="blast-wizard"
        >
          {/* ── stepper header ── */}
          <div className="border-b border-border px-6 py-4">
            <Stepper step={step} />
          </div>

          {/* ── body ── */}
          <div className="px-6 py-5 space-y-5">

            {/* ════════════════ STEP 0 — AUDIENCE ════════════════ */}
            {step === 0 && (
              <div className="space-y-5">

                {/* compliance banner */}
                <div className="flex items-start gap-2.5 rounded-lg border px-4 py-3"
                  style={{ background: 'var(--blue-50,#eff6ff)', borderColor: 'rgba(59,130,246,.2)' }}>
                  <svg className="mt-0.5 shrink-0 h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a9 9 0 100 18A9 9 0 0010 1zm.75 5.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-[12.5px] leading-relaxed text-blue-900">
                    Only <strong>opted-in</strong> dealers with a mobile number are included — office &amp;
                    lane lines and opted-out accounts are excluded for WhatsApp compliance.
                  </p>
                </div>

                {/* audience mode toggle */}
                <section className="space-y-2" data-testid="audience-mode">
                  <label className="text-sm font-medium text-foreground">How do you want to choose dealers?</label>
                  <div className="flex gap-2">
                    <Chip on={audienceMode === 'filter'} onClick={() => setAudienceMode('filter')}>
                      By filter
                    </Chip>
                    <Chip on={audienceMode === 'manual'} onClick={() => setAudienceMode('manual')}>
                      Pick specific dealers
                    </Chip>
                  </div>
                </section>

                {audienceMode === 'manual' ? (
                  <section className="space-y-2" data-testid="audience-manual">
                    <label className="text-sm font-medium text-foreground">Select dealers</label>
                    <DealerPicker selected={selectedContactIds} onChange={setSelectedContactIds} />
                  </section>
                ) : (
                <>
                {/* state chips */}
                <section className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATES.map((s) => (
                      <Chip
                        key={s}
                        on={selectedStates.includes(s)}
                        onClick={() => setSelectedStates((p) => toggle(p, s))}
                      >
                        {stateLabel(s)}
                      </Chip>
                    ))}
                  </div>
                  <p className="text-[11.5px] text-foreground-muted">
                    {selectedStates.length ? `${selectedStates.length} selected` : 'All states'}
                  </p>
                </section>

                {/* specialization chips */}
                <section className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Specialization</label>
                  <div className="flex flex-wrap gap-2">
                    {VEHICLE_OPTIONS.map(({ value, label }) => (
                      <Chip
                        key={value}
                        on={selectedVehicles.includes(value)}
                        onClick={() => setSelectedVehicles((p) => toggle(p, value))}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </section>

                {/* estimated audience card */}
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background-subtle px-4 py-3.5">
                  <svg className="h-6 w-6 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.356-3.765M9 20H4v-2a4 4 0 015.356-3.765M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <div>
                    <p className="text-[12.5px] text-foreground-muted">Estimated audience</p>
                    <p className="text-xl font-bold tracking-tight">
                      {audienceFetching
                        ? <span className="text-foreground-muted text-sm animate-pulse">Calculating…</span>
                        : <>{audienceCount.toLocaleString()} <span className="text-sm font-medium text-foreground-muted">recipients</span></>}
                    </p>
                  </div>
                </div>
                </>
                )}
              </div>
            )}

            {/* ════════════════ STEP 1 — TEMPLATE + LANGUAGE ════════════════ */}
            {step === 1 && (
              <div className="space-y-5">

                {/* template family grid */}
                <section className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Choose an approved template</label>
                  {familyNames.length === 0 ? (
                    <p className="text-sm text-foreground-muted py-4 text-center">No approved templates yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {familyNames.map((fName) => {
                        const variants = templateGroups[fName];
                        const isSelected = templateName === fName;
                        return (
                          <button
                            key={fName}
                            type="button"
                            onClick={() => { setTemplateName(fName); }}
                            data-testid={`blast-template-card-${fName}`}
                            className={[
                              'text-left rounded-lg border p-3.5 transition-colors cursor-pointer',
                              isSelected
                                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                                : 'border-border bg-background hover:bg-background-hover',
                            ].join(' ')}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <code className="text-[11px] font-mono text-foreground-muted">{fName}</code>
                              {isSelected && (
                                <svg className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              )}
                            </div>
                            <div className="text-sm font-semibold mb-2">{fName.replace(/_/g, ' ')}</div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge tone="neutral" style={{ fontSize: 10 }}>{variants[0]?.category ?? '—'}</Badge>
                              {variants.map((v) => (
                                <Badge key={v.language} tone="blue" style={{ fontSize: 10 }}>{v.language}</Badge>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* hidden select kept for E2E backward-compat */}
                  <select
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="sr-only"
                    data-testid="blast-template"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="">—</option>
                    {familyNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </section>

                {/* default language select */}
                {availableLanguages.length > 0 && (
                  <section className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Default language</label>
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value as LanguagePreference)}
                      className={inputCls}
                      data-testid="blast-default-language"
                    >
                      {availableLanguages.map((l) => (
                        <option key={l} value={l}>{LANGUAGE_LABELS[l] ?? l}</option>
                      ))}
                    </select>
                    <p className="text-[11.5px] text-foreground-muted">
                      Used for contacts / states without a specific language mapping.
                    </p>
                  </section>
                )}

                {/* language delivery toggle */}
                <section className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Language delivery</label>
                  <div className="flex flex-col gap-2" data-testid="blast-language-mode">
                    <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="languageMode"
                        value="PREFERENCE"
                        checked={languageMode === 'PREFERENCE'}
                        onChange={() => setLanguageMode('PREFERENCE')}
                        className="h-3.5 w-3.5 border-border-strong text-accent focus:ring-accent"
                        data-testid="blast-language-mode-preference"
                      />
                      Dealer preference
                    </label>
                    <label className="inline-flex items-start gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="languageMode"
                        value="STATE"
                        checked={languageMode === 'STATE'}
                        onChange={() => setLanguageMode('STATE')}
                        className="mt-0.5 h-3.5 w-3.5 border-border-strong text-accent focus:ring-accent"
                        data-testid="blast-language-mode-state"
                      />
                      <span>
                        By dealer state
                        <span className="block text-[11.5px] text-foreground-muted">
                          Each dealer receives a message in the language(s) mapped to their state.
                          Unmapped states use the default language.
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                {/* ── STATE-mode coverage card ── */}
                {languageMode === 'STATE' && templateName && (
                  <>
                    {previewFetching && (
                      <div className="rounded-md border border-border bg-background-subtle px-4 py-3 text-sm text-foreground-muted animate-pulse">
                        Loading coverage preview…
                      </div>
                    )}

                    {!previewFetching && preview && (
                      <section
                        className="space-y-3 rounded-md border border-border bg-background-subtle p-4"
                        data-testid="blast-state-preview"
                      >
                        <div className="text-sm font-semibold text-foreground">
                          {preview.totalMessages} messages to {preview.uniqueContacts} dealers
                        </div>

                        {/* by language */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            By language
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(preview.byLanguage).map(([lang, count]) => (
                              <Pill key={lang} tone="blue">{lang}: {count}</Pill>
                            ))}
                          </div>
                        </div>

                        {/* by state */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            By state
                          </div>
                          <div className="space-y-1">
                            {preview.byState.map((row) => (
                              <div key={row.state} className="flex items-center justify-between gap-3 text-[12.5px] text-foreground">
                                <span>{row.state}</span>
                                <span className="text-foreground-muted">
                                  {row.contacts} dealers · {row.languages.join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* ── GAP BLOCKER ── */}
                    {hasGaps && preview && (
                      <section
                        className="space-y-2 rounded-md border border-red-500/30 bg-red-50 p-4"
                        data-testid="blast-state-gaps"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                          </svg>
                          Missing template translations
                        </div>
                        <ul className="space-y-1 text-[12.5px] text-red-600">
                          {preview.gaps.map((gap) => (
                            <li key={gap.language}>
                              <strong>{gap.language}</strong> required by{' '}
                              {gap.requiredByStates.join(', ')} — no approved {gap.language}{' '}
                              version of <code className="font-mono text-[11px]">{gap.templateName}</code>
                            </li>
                          ))}
                        </ul>
                        {/* AI generation placeholder */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {preview.gaps.map((gap) => (
                            <button
                              key={gap.language}
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => {
                                alert(`AI template generation — coming soon\n\nGenerating a ${gap.language} version of ${gap.templateName} will be available in a future release.`);
                              }}
                            >
                              ✨ Generate {gap.language} with AI
                            </button>
                          ))}
                          <span className="self-center text-[11.5px] text-foreground-muted">
                            or pick another template
                          </span>
                        </div>
                      </section>
                    )}
                  </>
                )}

                {/* variable mapping (preserved for E2E) */}
                {variables.length > 0 && (
                  <section className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Variable mapping</label>
                    <div className="space-y-2">
                      {variables.map((v, idx) => {
                        const num = String(idx + 1);
                        return (
                          <div key={num} className="flex items-center gap-3">
                            <code className="shrink-0 rounded bg-background-hover px-2 py-0.5 font-mono text-xs text-foreground">
                              {'{{'}{num}{'}}'} ({v})
                            </code>
                            <select
                              value={variableMapping[num] ?? ''}
                              onChange={(e) => setVariableMapping({ ...variableMapping, [num]: e.target.value })}
                              className="flex-1 h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                              data-testid={`variable-${num}`}
                            >
                              <option value="">— pick a source —</option>
                              <option value="contact.name">contact.name</option>
                              <option value="contact.city">contact.city</option>
                              <option value="contact.state">contact.state</option>
                              <option value="literal:Customer">literal: &quot;Customer&quot;</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ════════════════ STEP 2 — REVIEW + SCHEDULE ════════════════ */}
            {step === 2 && (
              <div className="space-y-5">

                {/* campaign name */}
                <section className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Campaign name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={templateName ? templateName.replace(/_/g, ' ') : 'e.g. June Service Push'}
                    className={inputCls}
                    data-testid="blast-name"
                  />
                </section>

                {/* when to send */}
                <section className="space-y-2">
                  <label className="text-sm font-medium text-foreground">When to send</label>
                  <div className="flex gap-2">
                    <Chip on={when === 'now'} onClick={() => setWhen('now')}>
                      Send now
                    </Chip>
                    <Chip on={when === 'later'} onClick={() => setWhen('later')}>
                      Schedule
                    </Chip>
                  </div>
                  {when === 'later' && (
                    <div className="space-y-1.5 mt-2">
                      <input
                        type="datetime-local"
                        value={schedAt}
                        onChange={(e) => setSchedAt(e.target.value)}
                        className={`${inputCls} ${schedErr ? 'border-red-500' : ''}`}
                        data-testid="blast-scheduled-at"
                      />
                      {schedErr ? (
                        <p className="text-[12px] text-red-500">{schedErr}</p>
                      ) : sched ? (
                        <p className="text-[12px] text-foreground-muted">
                          Sends <strong>{sched.friendly}</strong>
                        </p>
                      ) : null}
                    </div>
                  )}
                </section>

                {/* summary card */}
                <div className="rounded-lg border border-border bg-background-subtle p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Summary
                  </p>
                  {[
                    ['Template',   <code key="t" className="font-mono text-[12px] text-foreground-muted">{templateName}</code>],
                    ['Audience',   audienceDesc],
                    ['Language',   `${languageMode === 'PREFERENCE' ? 'Dealer preference' : 'By dealer state'}${availableLanguages.length ? ` · ${availableLanguages.join(', ')}` : ''}`],
                    ['Recipients', <strong key="r">{recipientDesc}</strong>],
                    ['Delivery',   when === 'now' ? 'Immediately' : sched ? `Scheduled — ${sched.review}` : 'Scheduled — pick date'],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between gap-4 text-[13px]">
                      <span className="text-foreground-muted shrink-0">{k}</span>
                      <span className="text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-500" data-testid="blast-form-error">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* ── footer ── */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Button type="button" variant="ghost" onClick={goBack}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-3">
              {/* recipient count hint in footer on step 0 */}
              {step === 0 && !audienceFetching && (
                <span className="text-[12.5px] text-foreground-muted">
                  {audienceCount.toLocaleString()} recipients
                </span>
              )}

              {step < 2 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={
                    (step === 0 && !canContinueStep0) ||
                    (step === 1 && !canContinueStep1)
                  }
                  onClick={goNext}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={create.isPending || (when === 'later' && !schedValid) || hasGaps}
                  onClick={handleSubmit}
                  data-testid="blast-create"
                >
                  {create.isPending
                    ? 'Creating…'
                    : when === 'now'
                    ? 'Send now'
                    : 'Schedule'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
