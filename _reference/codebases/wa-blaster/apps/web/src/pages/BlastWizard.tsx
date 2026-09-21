import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listTemplates, type Template } from '../api/templates';
import { listSegments, type Segment } from '../api/segments';
import { createBlast, previewStateLanguages, type CreateBlastInput, type BlastLanguageMode } from '../api/blasts';
import type { LanguagePreference } from '../api/contacts';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';

export default function BlastWizard() {
  const navigate = useNavigate();

  const { data: templates } = useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => listTemplates({ status: ['APPROVED'] }),
  });
  const { data: segments } = useQuery({ queryKey: ['segments'], queryFn: listSegments });

  const [name, setName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<LanguagePreference>('EN');
  const [segmentId, setSegmentId] = useState<string>('');
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [scheduledAt, setScheduledAt] = useState<string>(new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16));
  const [languageMode, setLanguageMode] = useState<BlastLanguageMode>('PREFERENCE');
  const [error, setError] = useState<string | null>(null);

  const { data: preview } = useQuery({
    queryKey: ['state-preview', templateName, defaultLanguage, segmentId],
    queryFn: () => previewStateLanguages({ templateName, defaultLanguage, segmentId: segmentId || undefined }),
    enabled: languageMode === 'STATE' && !!templateName,
  });
  const hasGaps = languageMode === 'STATE' && (preview?.gaps.length ?? 0) > 0;

  // Group approved templates by name
  const templateGroups: Record<string, Template[]> = {};
  for (const t of templates ?? []) {
    (templateGroups[t.name] ??= []).push(t);
  }
  const selectedGroup = templateName ? templateGroups[templateName] : undefined;
  const availableLanguages = selectedGroup?.map((t) => t.language) ?? [];
  const variables = selectedGroup?.[0]?.variables ?? [];

  const create = useMutation({
    mutationFn: createBlast,
    onSuccess: (blast) => navigate(`/blasts/${blast.id}`),
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CreateBlastInput = {
      name,
      templateName,
      defaultLanguage,
      segmentId: segmentId || undefined,
      variableMapping,
      scheduledAt: new Date(scheduledAt).toISOString(),
      languageMode,
    };
    create.mutate(input);
  }

  const inputClass =
    'w-full h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground ' +
    'placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent ' +
    'disabled:opacity-50';

  return (
    <Page>
      <PageHead title="New Blast" />

      <div className="mx-auto max-w-2xl">
        <Card>
          <form onSubmit={onSubmit} className="space-y-6" data-testid="blast-wizard">

            {/* 1. Name */}
            <section className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                1. Name your blast
              </label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hari Raya 2026 promo"
                className={inputClass}
                data-testid="blast-name"
              />
            </section>

            {/* 2. Pick template */}
            <section className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                2. Pick an approved template
              </label>
              <select
                required value={templateName}
                onChange={(e) => { setTemplateName(e.target.value); setVariableMapping({}); }}
                className={inputClass}
                data-testid="blast-template"
              >
                <option value="">— select a template —</option>
                {Object.keys(templateGroups).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {availableLanguages.length > 0 && (
                <p className="text-[12px] text-foreground-muted">
                  Languages available: {availableLanguages.join(', ')}
                </p>
              )}
            </section>

            {/* 3. Default language */}
            <section className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                3. Default language for contacts without preference
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as LanguagePreference)}
                className={inputClass}
                data-testid="blast-default-language"
              >
                {availableLanguages.length > 0
                  ? availableLanguages.map((l) => (<option key={l} value={l}>{l}</option>))
                  : ['EN','MS','ZH','TA','OTHER'].map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </section>

            {/* Language mode */}
            <section className="space-y-2">
              <label className="text-sm font-medium text-foreground">Language by:</label>
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
                  Contact preference
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
                    Contact state
                    <span className="block text-[12px] text-foreground-muted">
                      Each contact receives a message in every language mapped to their state. Unmapped states use the default language.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            {/* 4. Audience */}
            <section className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                4. Audience
              </label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className={inputClass}
                data-testid="blast-segment"
              >
                <option value="">All opted-in contacts</option>
                {segments?.map((s: Segment) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </section>

            {/* 5. Variable mapping */}
            {variables.length > 0 && (
              <section className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  5. Variable mapping
                </label>
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
                          className={
                            'flex-1 h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground ' +
                            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent'
                          }
                          data-testid={`variable-${num}`}
                        >
                          <option value="">— pick a source —</option>
                          <option value="contact.name">contact.name</option>
                          <option value="contact.city">contact.city</option>
                          <option value="contact.state">contact.state</option>
                          <option value="literal:Customer">literal: "Customer"</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 6. Schedule */}
            <section className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                6. Schedule
              </label>
              <input
                type="datetime-local" required value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={
                  'h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground ' +
                  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent'
                }
                data-testid="blast-scheduled-at"
              />
              <p className="text-[12px] text-foreground-muted">Set in the past or now to send immediately.</p>
            </section>

            {/* State-mode preview */}
            {languageMode === 'STATE' && templateName && preview && (
              <section
                className="space-y-3 rounded-md border border-border bg-background-subtle p-4"
                data-testid="blast-state-preview"
              >
                <div className="text-sm font-medium text-foreground">
                  {preview.totalMessages} messages to {preview.uniqueContacts} contacts
                </div>

                <div className="space-y-1.5">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-foreground-muted">By language</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(preview.byLanguage).map(([lang, count]) => (
                      <Pill key={lang} tone="blue">{lang}: {count}</Pill>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-foreground-muted">By state</div>
                  <div className="space-y-1">
                    {preview.byState.map((row) => (
                      <div key={row.state} className="flex items-center justify-between gap-3 text-[13px] text-foreground">
                        <span>{row.state}</span>
                        <span className="text-foreground-muted">
                          {row.contacts} contacts · {row.languages.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* State-mode gaps blocker */}
            {hasGaps && preview && (
              <section
                className="space-y-1.5 rounded-md border border-red-500/30 bg-red-50 p-4"
                data-testid="blast-state-gaps"
              >
                <div className="text-sm font-medium text-red-500">Missing template translations</div>
                <ul className="space-y-0.5 text-[13px] text-red-500">
                  {preview.gaps.map((gap) => (
                    <li key={gap.language}>
                      {gap.language} required by {gap.requiredByStates.join(', ')}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {error && (
              <p className="text-sm text-red-500" data-testid="blast-form-error">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/blasts')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={create.isPending || !name || !templateName || hasGaps}
                data-testid="blast-create"
              >
                {create.isPending ? 'Creating…' : 'Schedule blast'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
