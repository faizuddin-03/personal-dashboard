import { useMemo, useState, useCallback } from 'react';
import { useToast } from '../components/toast/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  listTemplates,
  submitTemplate,
  deleteTemplate,
  syncTemplates,
  type Template,
  type TemplateCategory,
  type TemplateStatus,
} from '../api/templates';
import { useAuth } from '../auth/AuthContext';
import { isAdmin } from '../lib/roles';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/Pill';
import { TemplatesAIWizard } from '../components/TemplatesAIWizard';
import {
  IcRefresh,
  IcX,
  IcAlert,
  IcEdit,
  IcTrash,
  IcSend,
  IcSparkle,
  IcEye,
  IcCheck,
} from '../components/ui/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A "family" groups all language variants of the same (name, version) together. */
interface Family {
  name: string;
  version: number;
  category: TemplateCategory;
  humanTitle: string;
  variants: Template[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a readable title from a snake_case name slug. */
function toHumanTitle(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Group flat Template[] into Family[]. */
function buildFamilies(templates: Template[]): Family[] {
  const map = new Map<string, Family>();
  for (const t of templates) {
    const key = `${t.name}:${t.version}`;
    const existing = map.get(key);
    if (existing) {
      existing.variants.push(t);
    } else {
      map.set(key, {
        name: t.name,
        version: t.version,
        category: t.category,
        humanTitle: toHumanTitle(t.name),
        variants: [t],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Substitute {{n}} placeholders with variable names (or a fallback). */
function fillVars(bodyText: string, variables: string[], samples?: string[]): string {
  return bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const idx = parseInt(n, 10) - 1;
    if (samples && samples[idx] !== undefined) return samples[idx];
    if (variables[idx]) return variables[idx];
    return `{{${n}}}`;
  });
}

/** Rollup status across variants for the family card. */
function rollupStatus(variants: Template[]): string {
  const by: Partial<Record<TemplateStatus, number>> = {};
  for (const v of variants) by[v.status] = (by[v.status] ?? 0) + 1;
  const order: TemplateStatus[] = ['APPROVED', 'PENDING', 'REJECTED', 'DRAFT', 'DISABLED'];
  return order
    .filter((s) => by[s])
    .map((s) => `${by[s]} ${s.toLowerCase()}`)
    .join(' · ');
}

/** Map a TemplateStatus to a BadgeTone. */
function statusTone(status: TemplateStatus) {
  const map: Record<TemplateStatus, 'success' | 'human' | 'red' | 'neutral'> = {
    APPROVED: 'success',
    PENDING: 'human',
    REJECTED: 'red',
    DRAFT: 'neutral',
    DISABLED: 'neutral',
  };
  return map[status] ?? 'neutral';
}

const CATEGORY_CHIPS: Array<{ label: string; value: TemplateCategory | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Utility', value: 'UTILITY' },
  { label: 'Authentication', value: 'AUTHENTICATION' },
];

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: TemplateStatus }) {
  const colorMap: Record<TemplateStatus, string> = {
    APPROVED: '#22c55e',
    PENDING: '#f59e0b',
    REJECTED: '#ef4444',
    DRAFT: '#9ca3af',
    DISABLED: '#9ca3af',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colorMap[status] ?? '#9ca3af',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Family Card ──────────────────────────────────────────────────────────────

interface FamilyCardProps {
  family: Family;
  onOpen: (family: Family, variantIdx: number) => void;
}

function FamilyCard({ family, onOpen }: FamilyCardProps) {
  // Default to the first APPROVED variant, else first
  const defaultIdx = useMemo(() => {
    const ai = family.variants.findIndex((v) => v.status === 'APPROVED');
    return ai >= 0 ? ai : 0;
  }, [family.variants]);

  const [activeIdx, setActiveIdx] = useState(defaultIdx);
  const active = family.variants[activeIdx];
  const multipleStatuses = new Set(family.variants.map((v) => v.status)).size > 1;

  return (
    <div
      className="rounded-xl border border-border bg-background hover:bg-background-hover transition-colors cursor-pointer"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}
      onClick={() => onOpen(family, activeIdx)}
      data-testid={`template-group-${family.name}`}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span
              className="font-mono truncate"
              style={{ fontSize: 11.5, color: 'var(--foreground-muted)', fontWeight: 600 }}
            >
              {family.name}
            </span>
            <span className="text-xs text-foreground-muted font-normal">v{family.version}</span>
          </div>
          <div className="truncate" style={{ fontSize: 14.5, fontWeight: 600 }}>
            {family.humanTitle}
          </div>
        </div>
        <Badge tone={statusTone(active.status)}>
          {active.status}
        </Badge>
      </div>

      {/* Language sub-tabs */}
      <div
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        onClick={(e) => e.stopPropagation()}
      >
        {family.variants.map((v, i) => (
          <button
            key={v.language}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              i === activeIdx
                ? 'border-accent bg-accent text-white'
                : 'border-border-strong bg-background text-foreground hover:bg-background-hover'
            }`}
            style={{ height: 24 }}
            data-testid={`language-tab-${v.language}`}
          >
            <StatusDot status={v.status} />
            {v.language}
          </button>
        ))}
      </div>

      {/* Body preview */}
      <div
        className="text-foreground-muted"
        style={{
          padding: '11px 13px',
          borderRadius: 11,
          background: 'var(--bg-subtle, #f9fafb)',
          fontSize: 12.5,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 58,
        }}
      >
        {fillVars(active.bodyText, active.variables)}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge tone="neutral">{family.category}</Badge>
        {multipleStatuses && (
          <span className="text-foreground-muted" style={{ fontSize: 11 }}>
            {rollupStatus(family.variants)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  family: Family;
  startIdx: number;
  canEdit: boolean;
  onClose: () => void;
  onToast: (msg: string, variant?: 'success' | 'error') => void;
  onEditRoute: (name: string) => void;
  onRegenerate: (family: Family, variant: Template) => void;
  onStartBlast: (name: string) => void;
}

function DetailDrawer({ family, startIdx, canEdit, onClose, onToast, onEditRoute, onRegenerate, onStartBlast }: DetailDrawerProps) {
  const qc = useQueryClient();
  const [activeIdx, setActiveIdx] = useState(startIdx);
  const variant = family.variants[activeIdx];

  const submitMut = useMutation({
    mutationFn: () => submitTemplate(family.name, family.version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onToast(`Submitted ${family.name} for review`);
    },
    onError: () => onToast('Submit failed', 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onClose();
      onToast('Template deleted');
    },
    onError: () => onToast('Delete failed', 'error'),
  });

  const canSubmit = variant.status === 'DRAFT' || variant.status === 'REJECTED';
  const canDelete = variant.status === 'DRAFT' || variant.status === 'REJECTED';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-40 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
    >
      {/* Sheet panel */}
      <div
        className="relative h-full bg-background border-l border-border flex flex-col overflow-hidden"
        style={{ width: 480, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={family.humanTitle}
      >
        {/* Header */}
        <div
          className="border-b border-border"
          style={{ padding: '20px 24px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span
              className="font-mono truncate text-foreground-muted"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {family.name}
            </span>
            <button
              type="button"
              className="text-foreground-muted hover:text-foreground"
              onClick={onClose}
              aria-label="close"
            >
              <IcX size={18} />
            </button>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{family.humanTitle}</div>

          {/* Category + language tabs */}
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone="neutral">{family.category}</Badge>
            {family.variants.map((v, i) => (
              <button
                key={v.language}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === activeIdx
                    ? 'border-accent bg-accent text-white'
                    : 'border-border-strong bg-background text-foreground hover:bg-background-hover'
                }`}
                style={{ height: 26 }}
                data-testid={`language-tab-${v.language}`}
              >
                <StatusDot status={v.status} />
                {v.language}
              </button>
            ))}
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Status + meta line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <StatusPill status={variant.status} testId={`status-badge-${variant.status}`} />
            <span className="text-foreground-muted" style={{ fontSize: 12.5 }}>
              {variant.language} · reviewed independently by Meta
            </span>
          </div>

          {/* Rejection card */}
          {variant.status === 'REJECTED' && variant.rejectionReason && (
            <div
              className="mb-4 rounded-xl border"
              style={{
                padding: '13px 15px',
                background: 'var(--red-50, #fef2f2)',
                borderColor: 'var(--red-200, #fecaca)',
              }}
              data-testid="rejection-reason"
            >
              <div style={{ display: 'flex', gap: 9 }}>
                <IcAlert size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-mono"
                    style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 3 }}
                  >
                    Rejected by Meta
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{variant.rejectionReason}</div>
                </div>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IcEdit size={14} />}
                    onClick={() => onEditRoute(family.name)}
                  >
                    Edit manually
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToast('Meta rejection details — coming soon')}
                  >
                    View Meta details
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp preview */}
          <div
            className="text-foreground-muted uppercase tracking-widest"
            style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}
          >
            Preview
          </div>
          <div
            className="rounded-xl mb-4"
            style={{ padding: '16px 18px', background: 'var(--bg-subtle, #f9fafb)' }}
          >
            <div
              className="rounded-2xl text-foreground"
              style={{
                maxWidth: '88%',
                padding: '10px 13px',
                borderRadius: 14,
                borderBottomLeftRadius: 4,
                background: 'var(--accent-fill, #dcfce7)',
                border: '1px solid var(--accent-border, #bbf7d0)',
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {fillVars(variant.bodyText, variant.variables)}
            </div>
          </div>

          {/* Start blast — approved templates can be sent to dealers */}
          {variant.status === 'APPROVED' && (
            <Button
              variant="primary"
              icon={<IcSend size={15} />}
              onClick={() => onStartBlast(family.name)}
              style={{ width: '100%', marginBottom: 16 }}
              data-testid="template-start-blast"
            >
              Start blast with this template
            </Button>
          )}

          {/* Variables table */}
          {variant.variables.length > 0 && (
            <>
              <div
                className="text-foreground-muted uppercase tracking-widest"
                style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}
              >
                Variables
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {variant.variables.map((v, i) => (
                  <span
                    key={i}
                    className="font-mono text-foreground-muted"
                    style={{
                      fontSize: 11.5,
                      padding: '4px 9px',
                      borderRadius: 8,
                      background: 'var(--bg-subtle, #f9fafb)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {`{{${i + 1}}}`} = {v}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="border-t border-border"
          style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', gap: 9 }}
        >
          {canEdit ? (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    icon={<IcTrash size={14} />}
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete ${variant.language} variant of ${family.name}?`)) {
                        deleteMut.mutate(variant.id);
                      }
                    }}
                    data-testid="template-delete"
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<IcSparkle size={14} />}
                  onClick={() => onRegenerate(family, variant)}
                >
                  Regenerate with AI
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<IcEdit size={14} />}
                  onClick={() => onEditRoute(family.name)}
                  data-testid="template-edit"
                >
                  Edit
                </Button>
                {canSubmit && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<IcSend size={14} />}
                    disabled={submitMut.isPending}
                    onClick={() => submitMut.mutate()}
                    data-testid="template-submit-meta"
                  >
                    {submitMut.isPending ? 'Submitting…' : 'Submit for review'}
                  </Button>
                )}
                {variant.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IcCheck size={14} />}
                    onClick={() => onEditRoute(family.name)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </>
          ) : (
            <span
              className="text-foreground-muted"
              style={{ fontSize: 12, display: 'flex', gap: 5, alignItems: 'center' }}
            >
              <IcEye size={14} />
              View only — creating & editing is a Super Admin action
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Templates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = isAdmin(user?.role);
  const qc = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'ALL'>('ALL');
  const [detail, setDetail] = useState<{ family: Family; idx: number } | null>(null);
  const { showToast } = useToast();

  // AI wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardRegen, setWizardRegen] = useState<{
    name?: string;
    language?: string;
    rejectionReason?: string;
    body?: string;
  } | undefined>(undefined);

  const openWizard = useCallback(() => {
    setWizardRegen(undefined);
    setWizardOpen(true);
  }, []);

  const openRegenWizard = useCallback((family: Family, variant: Template) => {
    setDetail(null);
    setWizardRegen({
      name: family.name,
      language: variant.language,
      rejectionReason: variant.rejectionReason ?? undefined,
      body: variant.bodyText,
    });
    setWizardOpen(true);
  }, []);

  const syncMut = useMutation({
    mutationFn: syncTemplates,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      showToast(
        r.checked === 0
          ? 'No templates found on Meta to sync'
          : `Synced ${r.checked} from Meta — ${r.imported} imported, ${r.updated} updated` +
              (r.categoryChanged > 0
                ? `, ${r.categoryChanged} category change${r.categoryChanged > 1 ? 's' : ''}`
                : ''),
      );
    },
    onError: () => showToast('Sync with Meta failed', 'error'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', categoryFilter],
    queryFn: () =>
      listTemplates({
        category: categoryFilter !== 'ALL' ? [categoryFilter] : undefined,
      }),
  });

  const families = useMemo(() => (data ? buildFamilies(data) : []), [data]);

  return (
    <div className="mx-auto max-w-[1440px] p-8 max-[1100px]:p-6 max-[720px]:p-4">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-heading">Templates</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<IcRefresh size={15} />}
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
          >
            {syncMut.isPending ? 'Syncing…' : 'Sync with Meta'}
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              icon={<IcSparkle size={14} />}
              onClick={openWizard}
              data-testid="add-template"
            >
              Create template
            </Button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setCategoryFilter(chip.value)}
            aria-pressed={categoryFilter === chip.value}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              categoryFilter === chip.value
                ? 'border-accent bg-accent text-white'
                : 'border-border-strong bg-background text-foreground hover:bg-background-hover'
            }`}
            data-testid={chip.value === 'ALL' ? 'filter-category-all' : `filter-category-${chip.value}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <p className="text-sm text-foreground-muted">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load templates.</p>}

      {!isLoading && !error && families.length === 0 && (
        <div className="rounded-xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-foreground-muted mb-4">No templates yet.</p>
          {canEdit && (
            <Button variant="primary" icon={<IcSparkle size={14} />} onClick={openWizard}>
              Create template
            </Button>
          )}
        </div>
      )}

      {families.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {families.map((fam) => (
            <FamilyCard
              key={`${fam.name}:${fam.version}`}
              family={fam}
              onOpen={(f, idx) => setDetail({ family: f, idx })}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <DetailDrawer
          family={detail.family}
          startIdx={detail.idx}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
          onToast={showToast}
          onEditRoute={(name) => {
            setDetail(null);
            navigate(`/templates/${encodeURIComponent(name)}`);
          }}
          onRegenerate={openRegenWizard}
          onStartBlast={(name) => {
            setDetail(null);
            navigate(`/blasts/new?template=${encodeURIComponent(name)}`);
          }}
        />
      )}

      {/* AI Wizard (create + regenerate) — mounted only while open so each open starts with fresh state */}
      {wizardOpen && (
        <TemplatesAIWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          regenerate={wizardRegen}
          onToast={showToast}
          onGenerateFailed={() => {
            setWizardOpen(false);
            navigate('/templates/new');
          }}
        />
      )}

    </div>
  );
}
