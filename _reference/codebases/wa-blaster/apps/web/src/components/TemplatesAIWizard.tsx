// TemplatesAIWizard.tsx — 3-step AI template creation wizard
// Step 1: Describe (brief + languages + tone)
// Step 2: Pick a draft (per-language draft card with approval likelihood)
// Step 3: Review & submit (name input + optional edit + save-as-draft or create+submit)

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateTemplates,
  createTemplate,
  submitTemplate,
  type DraftSuggestion,
  type TemplateCategory,
} from '../api/templates';
import type { LanguagePreference } from '../api/contacts';
import { AIOrb } from './ui/AIOrb';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { VariableNameEditor } from './VariableNameEditor';
import {
  IcX,
  IcSparkle,
  IcChevR,
  IcSend,
  IcEdit,
  IcCheck,
  IcShield,
} from './ui/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_FULL: Record<string, string> = {
  EN: 'English',
  MS: 'Bahasa Malaysia',
  ZH: '中文',
};

const AVAILABLE_LANGS = ['EN', 'MS', 'ZH'];

const NAME_RULE_ERROR =
  'Name must start with a letter and contain only lowercase letters, numbers, and underscores.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^[^a-z]/, (c) => (c ? 'a' : 'a'))
    .slice(0, 40) || 'template';
}

function mapCategory(cat: string): TemplateCategory {
  const up = cat.toUpperCase();
  if (up === 'MARKETING' || up === 'UTILITY' || up === 'AUTHENTICATION') {
    return up as TemplateCategory;
  }
  // Design label → enum mapping
  const map: Record<string, TemplateCategory> = {
    RENEWAL: 'UTILITY',
    PROMOTION: 'MARKETING',
    ANNOUNCEMENT: 'MARKETING',
    SALES: 'MARKETING',
    ENGAGEMENT: 'MARKETING',
  };
  return map[up] ?? 'UTILITY';
}

function fillVars(body: string): string {
  const samples = ['Name', 'value', 'date', 'item', 'number'];
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => samples[parseInt(n, 10) - 1] ?? `{{${n}}}`);
}

/** Pull a human-readable message out of an axios/Nest error response. */
function extractApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return '';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TemplatesAIWizardProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fills Step 1 when regenerating a rejected variant. */
  regenerate?: {
    name?: string;
    language?: string;
    rejectionReason?: string;
    body?: string;
  };
  onToast?: (message: string, variant?: 'success' | 'error') => void;
  /** Called after AI generation fails, so the caller can fall back to manual creation. */
  onGenerateFailed?: () => void;
}

// ─── Approval likelihood bar ──────────────────────────────────────────────────

function ApprovalBar({ likelihood }: { likelihood: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const config = {
    HIGH: { label: 'High approval', pct: '88%', color: 'var(--green-500, #22c55e)', textColor: 'var(--green-700, #15803d)' },
    MEDIUM: { label: 'Medium approval', pct: '55%', color: 'var(--amber-500, #f59e0b)', textColor: 'var(--amber-700, #b45309)' },
    LOW: { label: 'Low approval', pct: '28%', color: 'var(--red-500, #ef4444)', textColor: 'var(--red-700, #b91c1c)' },
  };
  const c = config[likelihood];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: c.textColor }}>{c.label}</span>
      <span style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--bg-subtle, #f3f4f6)', overflow: 'hidden', display: 'inline-block' }}>
        <span style={{ display: 'block', height: '100%', width: c.pct, background: c.color, borderRadius: 3 }} />
      </span>
    </span>
  );
}

// ─── Step chip toggle ─────────────────────────────────────────────────────────

function ChipToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border-strong bg-background text-foreground hover:bg-background-hover'
      }`}
      style={{ height: 34 }}
    >
      {active && <IcCheck size={12} />}
      {children}
    </button>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function TemplatesAIWizard({ open, onClose, regenerate, onToast, onGenerateFailed }: TemplatesAIWizardProps) {
  const qc = useQueryClient();

  // — Step state —
  const [step, setStep] = useState(1);

  // — Step 1 state —
  const regenBrief = regenerate
    ? `Fix a Meta-rejected template.\nRejection reason: ${regenerate.rejectionReason ?? ''}\n\nOriginal body:\n${regenerate.body ?? ''}`
    : '';
  const [brief, setBrief] = useState(regenBrief);
  const [langs, setLangs] = useState<string[]>(
    regenerate?.language ? [regenerate.language] : ['EN'],
  );
  const [tone, setTone] = useState<'friendly' | 'formal'>('friendly');
  // Guardrail refusal (HTTP 400) surfaced inline so the user can revise the brief.
  const [generateError, setGenerateError] = useState('');

  // — Step 2 state —
  const [drafts, setDrafts] = useState<DraftSuggestion[]>([]);
  const [activeLang, setActiveLang] = useState<string>('EN');
  const [picked, setPicked] = useState<Record<string, DraftSuggestion>>({});

  // — Step 3 state —
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<TemplateCategory | null>(null);
  const [nameError, setNameError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [editedVariables, setEditedVariables] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState('');

  // ─ Shared by Save-as-draft and Submit ─
  const resolveNameSlug = () => templateName.trim() || slugify(brief);

  const buildCreateInput = (nameSlug: string) => {
    const pickedLangs = langs.filter((l) => picked[l]);
    const firstDraft = picked[pickedLangs[0]];
    return {
      name: nameSlug,
      category: category ?? mapCategory(firstDraft?.category ?? 'UTILITY'),
      variants: pickedLangs.map((l) => ({
        language: l as LanguagePreference,
        bodyText: editedBodies[l] ?? picked[l]?.body ?? '',
        variables: editedVariables[l] ?? picked[l]?.variables ?? [],
      })),
    };
  };

  const validateName = () => {
    if (!/^[a-z][a-z0-9_]*$/.test(resolveNameSlug())) {
      setNameError(NAME_RULE_ERROR);
      return false;
    }
    setNameError('');
    setSubmitError('');
    return true;
  };

  // ─ Reset all state and close (after successful save/submit, or a confirmed discard) ─
  const resetAndClose = useCallback(() => {
    setStep(1);
    setBrief(regenBrief);
    setLangs(regenerate?.language ? [regenerate.language] : ['EN']);
    setTone('friendly');
    setDrafts([]);
    setPicked({});
    setActiveLang('EN');
    setTemplateName('');
    setCategory(null);
    setNameError('');
    setEditOpen(false);
    setEditedBodies({});
    setEditedVariables({});
    setSubmitError('');
    setGenerateError('');
    onClose();
  }, [onClose, regenBrief, regenerate?.language]);

  // ─ Generate mutation ─
  const generateMut = useMutation({
    mutationFn: () => generateTemplates({ brief, languages: langs, tone }),
    onSuccess: (data) => {
      setDrafts(data);
      // Auto-select the first draft per language
      const autoPick: Record<string, DraftSuggestion> = {};
      for (const d of data) {
        if (!autoPick[d.language]) autoPick[d.language] = d;
      }
      setPicked(autoPick);
      setActiveLang(langs[0]);
      setStep(2);
    },
    onError: (err: unknown) => {
      // A 400 is a guardrail refusal (off-topic brief) or validation error: keep the
      // wizard open on step 1 with the reason so the user can rewrite the brief.
      // Anything else is a real service failure → fall back to manual creation.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setGenerateError(extractApiMessage(err) ||
          "That doesn't look like a WhatsApp template request. Describe the message you want to send to your dealers.");
        return;
      }
      onToast?.('AI drafting is unavailable right now — create your template manually.', 'error');
      onGenerateFailed?.();
    },
  });

  // ─ Submit mutation ─
  const submitMut = useMutation({
    mutationFn: async () => {
      const nameSlug = resolveNameSlug();
      if (!/^[a-z][a-z0-9_]*$/.test(nameSlug)) {
        throw new Error(NAME_RULE_ERROR);
      }
      await createTemplate(buildCreateInput(nameSlug));
      await submitTemplate(nameSlug, 1);
      return nameSlug;
    },
    onSuccess: (nameSlug) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onToast?.(
        `Submitted ${langs.length} language version${langs.length > 1 ? 's' : ''} of ${nameSlug} — Meta reviews each language separately (4–24 hours).`,
        'success',
      );
      resetAndClose();
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Submit failed. Please try again.');
    },
  });

  // ─ Save-as-draft mutation (creates DRAFT rows, no Meta submission) ─
  const saveDraftMut = useMutation({
    mutationFn: async () => {
      const nameSlug = resolveNameSlug();
      if (!/^[a-z][a-z0-9_]*$/.test(nameSlug)) {
        throw new Error(NAME_RULE_ERROR);
      }
      await createTemplate(buildCreateInput(nameSlug));
      return nameSlug;
    },
    onSuccess: (nameSlug) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onToast?.(
        `Saved ${nameSlug} as a draft — submit it for review from the template list when ready.`,
        'success',
      );
      resetAndClose();
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Save failed. Please try again.');
    },
  });

  // ─ User-initiated close: at the review step, confirm before discarding ─
  const requestClose = useCallback(() => {
    const busy = saveDraftMut.isPending || submitMut.isPending;
    const hasUnsavedWork = busy || (step === 3 && Object.keys(picked).length > 0);
    if (
      hasUnsavedWork &&
      !window.confirm("Close without saving? This template hasn't been saved as a draft.")
    ) {
      return;
    }
    resetAndClose();
  }, [step, picked, resetAndClose, saveDraftMut.isPending, submitMut.isPending]);

  if (!open) return null;

  const isRegen = Boolean(regenerate);
  const allPicked = langs.every((l) => picked[l]);
  const currentStep = step;

  // Drafts grouped by language (the mock returns multiple per language; step-2 lists them all)
  const draftsForLang = (l: string) => drafts.filter((d) => d.language === l);

  const toggleLang = (l: string) => {
    if (isRegen) return; // locked when regenerating
    setLangs((prev) =>
      prev.includes(l) ? (prev.length > 1 ? prev.filter((x) => x !== l) : prev) : [...prev, l],
    );
  };

  const derivedName = templateName || slugify(brief) || (regenerate?.name ?? 'template');

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16"
      onClick={requestClose}
      data-testid="wizard-backdrop"
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] flex flex-col rounded-xl border border-border bg-background overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 8rem)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isRegen ? 'Regenerate with AI' : 'Create template with AI'}
      >
        {/* ── Header ── */}
        <div
          className="border-b border-border flex items-center gap-3"
          style={{ padding: '18px 24px' }}
        >
          <AIOrb size={36} breathe />
          <div style={{ flex: 1 }}>
            <h3 className="text-[15px] font-semibold text-foreground" style={{ margin: 0 }}>
              {isRegen ? 'Regenerate with AI' : 'Create template with AI'}
            </h3>
            <p className="text-[12px] text-foreground-muted" style={{ margin: '2px 0 0' }}>
              {isRegen
                ? `Fixing ${regenerate?.name ?? ''} · ${LANG_FULL[regenerate?.language ?? ''] ?? regenerate?.language ?? ''}`
                : `Step ${currentStep} of 3 · ${currentStep === 1 ? 'describe it' : currentStep === 2 ? 'pick a draft' : 'review & submit'}`}
            </p>
          </div>
          <button
            type="button"
            className="text-foreground-muted hover:text-foreground"
            onClick={requestClose}
            aria-label="close"
          >
            <IcX size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* ════ STEP 1: Describe ════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Brief textarea */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground-muted mb-1.5">
                  Describe the message you want to send
                </label>
                <textarea
                  rows={4}
                  value={brief}
                  onChange={(e) => { setBrief(e.target.value); setGenerateError(''); }}
                  autoFocus
                  data-testid="wizard-brief"
                  placeholder="E.g. Remind dealers that vehicles in their stock with insurance expiring this month can be renewed through eAuto in minutes…"
                  className="w-full rounded-lg border border-border-strong bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  style={{ padding: '10px 12px', fontSize: 13.5, lineHeight: 1.55 }}
                />
              </div>

              {/* Language chips */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground-muted mb-1.5">
                  Languages — pick one or several
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVAILABLE_LANGS.map((l) => (
                    <ChipToggle key={l} active={langs.includes(l)} onClick={() => toggleLang(l)}>
                      {LANG_FULL[l]}
                    </ChipToggle>
                  ))}
                </div>
                <p className="text-[11.5px] text-foreground-muted mt-1.5">
                  AI localises each language properly — not a word-for-word copy.
                </p>
              </div>

              {/* Tone chips */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground-muted mb-1.5">
                  Tone
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ChipToggle active={tone === 'friendly'} onClick={() => setTone('friendly')}>
                    Friendly
                  </ChipToggle>
                  <ChipToggle active={tone === 'formal'} onClick={() => setTone('formal')}>
                    Formal
                  </ChipToggle>
                </div>
              </div>

              {/* Guardrail refusal / validation error */}
              {generateError && (
                <div
                  className="rounded-lg border px-3.5 py-3 flex items-start gap-2.5"
                  style={{ background: 'var(--red-50, #fef2f2)', borderColor: 'var(--red-200, #fecaca)' }}
                  data-testid="wizard-generate-error"
                >
                  <IcShield size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--red-700, #b91c1c)' }}>
                    {generateError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 2: Pick a draft ════ */}
          {step === 2 && (
            <div>
              {generateMut.isPending ? (
                /* Loading state */
                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                  <AIOrb size={48} breathe style={{ margin: '0 auto 14px' }} />
                  <p className="font-mono text-[13px] text-foreground-muted">
                    Drafting {langs.length > 1 ? `${langs.length} language sets` : 'options'}, optimised for Meta approval…
                  </p>
                </div>
              ) : (
                <>
                  {/* Language tabs (only if multiple) */}
                  {langs.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                      {langs.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setActiveLang(l)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[12px] font-medium transition-colors ${
                            activeLang === l
                              ? 'border-accent bg-accent text-white'
                              : 'border-border-strong bg-background text-foreground hover:bg-background-hover'
                          }`}
                          style={{ height: 28 }}
                        >
                          {LANG_FULL[l] ?? l}
                          {picked[l] && (
                            <IcCheck size={12} style={{ color: activeLang === l ? '#fff' : 'var(--green-600, #16a34a)' }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Draft cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {draftsForLang(activeLang).length === 0 ? (
                      /* No drafts returned for this language — show fallback */
                      <p className="text-sm text-foreground-muted">No draft returned for {LANG_FULL[activeLang] ?? activeLang}.</p>
                    ) : (
                      draftsForLang(activeLang).map((draft, i) => {
                        const isSelected = picked[activeLang] === draft;
                        return (
                          <div
                            key={i}
                            onClick={() => setPicked((p) => ({ ...p, [activeLang]: draft }))}
                            className="rounded-xl cursor-pointer transition-colors"
                            style={{
                              padding: '15px 17px',
                              border: isSelected
                                ? '2px solid var(--accent, #22c55e)'
                                : '1px solid var(--border)',
                              background: isSelected ? 'var(--accent-fill, #f0fdf4)' : 'var(--background)',
                            }}
                          >
                            {/* Card header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                              <span
                                className="font-mono truncate text-foreground-muted"
                                style={{ fontSize: 11.5, fontWeight: 600 }}
                              >
                                {draft.name}
                              </span>
                              <Badge tone="neutral">{draft.category}</Badge>
                              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ApprovalBar likelihood={draft.approvalLikelihood} />
                                {isSelected && (
                                  <IcCheck size={16} style={{ color: 'var(--accent, #22c55e)', flexShrink: 0 }} />
                                )}
                              </span>
                            </div>

                            {/* Body preview */}
                            <div
                              className="text-foreground"
                              style={{
                                padding: '10px 13px',
                                borderRadius: 12,
                                borderBottomLeftRadius: 4,
                                background: 'var(--bg-subtle, #f9fafb)',
                                fontSize: 13,
                                lineHeight: 1.55,
                                marginBottom: 9,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {fillVars(draft.body)}
                            </div>

                            {/* Rationale */}
                            <div
                              className="text-foreground-muted"
                              style={{ display: 'flex', gap: 7, fontSize: 11.5, lineHeight: 1.45 }}
                            >
                              <IcShield
                                size={13}
                                style={{
                                  color: draft.approvalLikelihood === 'HIGH'
                                    ? 'var(--green-600, #16a34a)'
                                    : 'var(--amber-500, #f59e0b)',
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              />
                              {draft.rationale}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ STEP 3: Review & submit ════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Template name input */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground-muted mb-1.5">
                  Template name{' '}
                  <span className="font-normal text-foreground-muted">· slug, e.g. insurance_renewal</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  data-testid="wizard-name"
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    setNameError('');
                    setSubmitError('');
                  }}
                  placeholder={derivedName}
                  pattern="^[a-z][a-z0-9_]*$"
                  className="w-full rounded-lg border border-border-strong bg-background text-foreground font-mono placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                />
                {nameError && (
                  <p className="text-[11.5px] text-red-500 mt-1">{nameError}</p>
                )}
                <p className="text-[11px] text-foreground-muted mt-1">
                  Must start with a letter; only <span className="font-mono">a–z 0–9 _</span>. Leave blank to use the auto-derived slug.
                </p>
              </div>

              {/* Category select — AI suggests one, but the user has the final say */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground-muted mb-1.5">
                  Category{' '}
                  <span className="font-normal text-foreground-muted">· how Meta classifies this template</span>
                </label>
                <select
                  value={category ?? 'UTILITY'}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full rounded-lg border border-border-strong bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                  data-testid="wizard-category"
                >
                  {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as TemplateCategory[]).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Summary cards */}
              {!editOpen && (
                <div
                  className="rounded-xl border border-border"
                  style={{ padding: '16px 18px', background: 'var(--bg-subtle, #f9fafb)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span className="font-mono text-foreground-muted" style={{ fontSize: 13, fontWeight: 600 }}>
                      {templateName || derivedName}
                    </span>
                    <AIOrb size={18} />
                  </div>
                  {langs.map((l) => {
                    const draft = picked[l];
                    if (!draft) return null;
                    return (
                      <div key={l} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#f59e0b',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{LANG_FULL[l] ?? l}</span>
                          <Badge tone="neutral">{draft.category}</Badge>
                          {editedBodies[l] && (
                            <span style={{ fontSize: 10.5, color: 'var(--accent, #22c55e)', fontWeight: 600 }}>
                              · edited
                            </span>
                          )}
                        </div>
                        <div
                          className="text-foreground"
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            fontSize: 12.5,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {fillVars(editedBodies[l] ?? draft.body)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edit content panel */}
              {editOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {langs.map((l) => {
                    const draft = picked[l];
                    if (!draft) return null;
                    const body = editedBodies[l] ?? draft.body;
                    return (
                      <div
                        key={l}
                        className="rounded-xl border border-border"
                        style={{ padding: '14px 16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{LANG_FULL[l] ?? l}</span>
                        </div>
                        <textarea
                          rows={4}
                          value={body}
                          data-testid={`wizard-edit-body-${l}`}
                          onChange={(e) =>
                            setEditedBodies((prev) => ({ ...prev, [l]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-border-strong bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                          style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}
                        />
                        {/* Name each {{n}} placeholder */}
                        <div
                          className="text-[10.5px] font-semibold text-foreground-muted uppercase tracking-widest"
                          style={{ marginBottom: 6 }}
                        >
                          Variables
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <VariableNameEditor
                            body={body}
                            variables={editedVariables[l] ?? draft.variables ?? []}
                            onChange={(vars) =>
                              setEditedVariables((prev) => ({ ...prev, [l]: vars }))
                            }
                          />
                        </div>
                        {/* Live preview */}
                        <div
                          className="text-[10.5px] font-semibold text-foreground-muted uppercase tracking-widest"
                          style={{ marginBottom: 6 }}
                        >
                          Preview
                        </div>
                        <div
                          className="text-foreground"
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            borderBottomLeftRadius: 4,
                            background: 'var(--accent-fill, #f0fdf4)',
                            border: '1px solid var(--accent-border, #bbf7d0)',
                            fontSize: 12.5,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {fillVars(body)}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', gap: 9 }}>
                    <Button variant="ghost" style={{ flex: 1 }} onClick={() => setEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      style={{ flex: 1 }}
                      icon={<IcCheck size={16} />}
                      onClick={() => setEditOpen(false)}
                      data-testid="wizard-apply-edits"
                    >
                      Apply edits
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions row (only when not in edit mode) */}
              {!editOpen && (
                <div style={{ display: 'flex', gap: 9 }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    icon={<IcEdit size={16} />}
                    onClick={() => setEditOpen(true)}
                    data-testid="wizard-edit-content"
                  >
                    Edit content
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    disabled={saveDraftMut.isPending || submitMut.isPending}
                    onClick={() => {
                      if (!validateName()) return;
                      saveDraftMut.mutate();
                    }}
                    data-testid="wizard-save-draft"
                  >
                    {saveDraftMut.isPending ? 'Saving…' : 'Save as draft'}
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    icon={<IcSend size={16} />}
                    disabled={submitMut.isPending || saveDraftMut.isPending}
                    onClick={() => {
                      if (!validateName()) return;
                      submitMut.mutate();
                    }}
                    data-testid="wizard-submit"
                  >
                    {submitMut.isPending ? 'Submitting…' : 'Submit for review'}
                  </Button>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <p className="text-[12px] text-red-500 text-center">{submitError}</p>
              )}

              {/* Footnote */}
              {!editOpen && (
                <div
                  className="text-foreground-muted text-[11.5px] text-center"
                  style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}
                >
                  <IcShield size={13} style={{ color: 'var(--green-600, #16a34a)' }} />
                  All {langs.length} version{langs.length > 1 ? 's' : ''} filed under one family · Meta reviews each language separately
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="border-t border-border flex justify-between items-center"
          style={{ padding: '16px 24px' }}
        >
          <Button
            variant="ghost"
            onClick={step === 1 ? requestClose : () => setStep(step - 1)}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step === 1 && (
            <Button
              variant="primary"
              icon={<IcSparkle size={16} />}
              disabled={!brief.trim() || langs.length === 0 || generateMut.isPending}
              onClick={() => { setGenerateError(''); generateMut.mutate(); }}
              style={{
                background: 'linear-gradient(135deg, #7C5CFC 0%, #5b8dee 100%)',
                borderColor: 'transparent',
              }}
            >
              {generateMut.isPending ? 'Generating…' : 'Generate suggestions'}
            </Button>
          )}

          {step === 2 && (
            <Button
              variant="primary"
              disabled={!allPicked || generateMut.isPending}
              onClick={() => {
                // Derive default name from first picked draft's name
                const firstPick = langs.map((l) => picked[l]).find(Boolean);
                if (firstPick && !templateName) {
                  setTemplateName(firstPick.name);
                }
                if (!category) {
                  setCategory(mapCategory(firstPick?.category ?? 'UTILITY'));
                }
                setStep(3);
              }}
            >
              Continue
              <IcChevR size={16} />
            </Button>
          )}

          {/* Step 3 footer is handled inline (submit button is in the body) */}
        </div>
      </div>
    </div>
  );
}
