import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTemplate,
  deleteTemplate,
  getTemplateGroup,
  submitTemplate,
  updateTemplateGroup,
  type CreateTemplateInput,
  type Template,
  type TemplateCategory,
  type TemplateVariant,
} from '../api/templates';
import type { LanguagePreference } from '../api/contacts';
import { useToast } from '../components/toast/ToastProvider';
import TemplateStatusBadge from '../components/TemplateStatusBadge';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { VariableNameEditor } from '../components/VariableNameEditor';

const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const CATEGORY_OPTIONS: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

function emptyVariant(language: LanguagePreference): TemplateVariant {
  return { language, bodyText: '', footerText: '', buttons: [], variables: [] };
}

function rowToVariant(row: Template): TemplateVariant {
  return {
    language: row.language,
    bodyText: row.bodyText,
    header: row.headerJson ?? undefined,
    footerText: row.footerText ?? undefined,
    buttons: row.buttonsJson ?? [],
    variables: row.variables ?? [],
  };
}

export default function TemplateForm() {
  const { name: paramName } = useParams<{ name?: string }>();
  const isEdit = Boolean(paramName);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('MARKETING');
  const [variants, setVariants] = useState<TemplateVariant[]>([emptyVariant('EN')]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: group } = useQuery({
    queryKey: ['template-group', paramName],
    queryFn: () => getTemplateGroup(paramName!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (group && group.length > 0) {
      setName(group[0].name);
      setCategory(group[0].category);
      setVariants(group.map(rowToVariant));
    }
  }, [group]);

  const groupStatus = useMemo(() => {
    if (!group || group.length === 0) return null;
    const statuses = new Set(group.map((r) => r.status));
    if (statuses.size === 1) return Array.from(statuses)[0];
    return null; // mixed
  }, [group]);

  const isAllDraft = group?.every((r) => r.status === 'DRAFT') ?? false;
  // Editing is allowed when creating, or when every variant is still a local DRAFT.
  const locked = isEdit && !isAllDraft;

  // Unsaved local changes vs what the server has — used to gate "Submit to Meta".
  const dirty = useMemo(() => {
    if (!group || group.length === 0) return false;
    const server = JSON.stringify({ category: group[0].category, variants: group.map(rowToVariant) });
    return server !== JSON.stringify({ category, variants });
  }, [group, category, variants]);

  const create = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: () => updateTemplateGroup(paramName!, { category, variants }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template-group', paramName] });
      showToast('Draft saved', 'success');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const submit = useMutation({
    mutationFn: () => submitTemplate(group![0].name, group![0].version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template-group', paramName] });
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
  });

  function setVariant(idx: number, patch: Partial<TemplateVariant>) {
    setVariants((cur) => cur.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function addLanguage(language: LanguagePreference) {
    if (variants.some((v) => v.language === language)) return;
    setVariants((cur) => [...cur, emptyVariant(language)]);
    setActiveTab(variants.length);
  }

  function removeLanguage(idx: number) {
    if (variants.length <= 1) return;
    setVariants((cur) => cur.filter((_, i) => i !== idx));
    setActiveTab(0);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isEdit) {
      update.mutate();
    } else {
      const input: CreateTemplateInput = { name, category, variants };
      create.mutate(input);
    }
  }

  return (
    <Page>
      <PageHead
        title={isEdit ? `Template: ${name}` : 'New Template'}
        actions={isEdit && groupStatus ? <TemplateStatusBadge status={groupStatus} /> : undefined}
      />

      {group && group[0]?.rejectionReason && (
        <div
          className="mb-6 rounded-md border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-500"
          data-testid="rejection-reason"
        >
          <strong className="font-medium">Rejection reason:</strong>{' '}
          {group[0].rejectionReason}
        </div>
      )}

      <Card>
        <form onSubmit={onSubmit} className="space-y-5" data-testid="template-form">
          <Field label="Template name (lowercase, digits, underscores)">
            <input
              type="text"
              required
              pattern="^[a-z][a-z0-9_]*$"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
              className="w-full rounded-md border border-border-strong bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="template-name"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              disabled={locked}
              className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="template-category"
            >
              {CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-0">
              <div className="flex gap-1" data-testid="language-tabs">
                {variants.map((v, idx) => (
                  <button
                    key={v.language}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={
                      activeTab === idx
                        ? 'border-b-2 border-accent px-4 py-2 text-sm font-medium text-foreground transition-colors'
                        : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground'
                    }
                    data-testid={`language-tab-${v.language}`}
                  >
                    {v.language}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <select
                  className="rounded-md border border-border-strong bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  value=""
                  onChange={(e) => { if (e.target.value) addLanguage(e.target.value as LanguagePreference); }}
                  disabled={locked}
                  data-testid="add-language-select"
                >
                  <option value="">+ Add language</option>
                  {LANGUAGE_OPTIONS.filter((l) => !variants.some((v) => v.language === l)).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {variants.length > 1 && !locked && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(activeTab)}
                    className="text-xs text-red-500 hover:text-red-500"
                    data-testid="remove-language"
                  >
                    Remove current
                  </button>
                )}
              </div>
            </div>

            <VariantEditor
              variant={variants[activeTab]}
              disabled={locked}
              onChange={(patch) => setVariant(activeTab, patch)}
            />
          </section>

          {error && (
            <p className="text-sm text-red-500" data-testid="template-form-error">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/templates')}
            >
              Cancel
            </Button>
            {!locked && (
              <Button
                type="submit"
                variant="primary"
                disabled={create.isPending || update.isPending}
                data-testid="template-submit-draft"
              >
                {create.isPending || update.isPending
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Save as draft'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {isEdit && group && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => { if (window.confirm('Delete all variants of this template?')) group.forEach((r) => remove.mutate(r.id)); }}
            disabled={!isAllDraft && groupStatus !== 'REJECTED' && groupStatus !== 'DISABLED'}
            data-testid="template-delete"
          >
            Delete
          </Button>
          {isAllDraft && (
            <Button
              type="button"
              variant="primary"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || dirty}
              title={dirty ? 'Save your changes before submitting' : undefined}
              data-testid="template-submit-meta"
            >
              {submit.isPending ? 'Submitting…' : dirty ? 'Save changes first' : 'Submit to Meta'}
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}

function VariantEditor({
  variant, disabled, onChange,
}: {
  variant: TemplateVariant;
  disabled: boolean;
  onChange: (patch: Partial<TemplateVariant>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Header text (optional, max 60 chars)">
        <input
          type="text"
          maxLength={60}
          value={variant.header?.text ?? ''}
          onChange={(e) => onChange({ header: e.target.value ? { type: 'TEXT', text: e.target.value } : undefined })}
          disabled={disabled}
          className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="variant-header"
        />
      </Field>
      <Field label="Body text (required, use {{1}}, {{2}} for variables)">
        <textarea
          required
          rows={4}
          value={variant.bodyText}
          onChange={(e) => onChange({ bodyText: e.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-border-strong bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="variant-body"
        />
      </Field>
      <Field label="Footer text (optional, max 60 chars)">
        <input
          type="text"
          maxLength={60}
          value={variant.footerText ?? ''}
          onChange={(e) => onChange({ footerText: e.target.value || undefined })}
          disabled={disabled}
          className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="variant-footer"
        />
      </Field>
      <Field label="Variable names (name each {{n}} used in the body)">
        <VariableNameEditor
          body={variant.bodyText}
          variables={variant.variables}
          onChange={(variables) => onChange({ variables })}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
