import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSegment,
  deleteSegment,
  listSegments,
  previewSegment,
  updateSegment,
  type Segment,
} from '../api/segments';
import type { ContactFilter } from '../api/contacts';
import FilterBuilder from '../components/FilterBuilder';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Segments() {
  const qc = useQueryClient();
  const { data: segments, isLoading } = useQuery({ queryKey: ['segments'], queryFn: listSegments });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<ContactFilter>({});
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createSegment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
      resetForm();
    },
    onError: (e: unknown) => setFormError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateSegment>[1] }) =>
      updateSegment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
      resetForm();
    },
    onError: (e: unknown) => setFormError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: deleteSegment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  });

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setFilter({});
    setFormError(null);
  }

  function startEdit(s: Segment) {
    setEditingId(s.id);
    setName(s.name);
    setDescription(s.description ?? '');
    setFilter((s.filterJson as ContactFilter) ?? {});
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, input: { name, description: description || undefined, filter } });
    } else {
      create.mutate({ name, description: description || undefined, filter });
    }
  }

  function onDelete(s: Segment) {
    if (window.confirm(`Delete segment "${s.name}"?`)) remove.mutate(s.id);
  }

  return (
    <Page>
      <PageHead title="Segments" subtitle="Saved demographic filters for targeting blasts." />

      <Card title={editingId ? 'Edit segment' : 'Create segment'} className="mb-8">
        <form onSubmit={onSubmit} className="space-y-4" data-testid="segment-form">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Segment name (e.g. KL Malays 25-45)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
              data-testid="segment-name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={2}
              data-testid="segment-description"
            />
          </div>
          <FilterBuilder value={filter} onChange={setFilter} />
          {formError && (
            <p className="text-sm text-red-500" data-testid="segment-form-error">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            {editingId && (
              <Button type="button" variant="ghost" size="md" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={create.isPending || update.isPending}
              data-testid="segment-submit"
            >
              {editingId ? 'Save changes' : 'Create segment'}
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wide">Saved segments</h2>
        {isLoading && <p className="text-sm text-foreground-muted">Loading...</p>}
        {segments && segments.length === 0 && (
          <p className="text-sm text-foreground-muted">No segments yet. Create one above.</p>
        )}
        {segments && segments.map((s) => (
          <SegmentRow key={s.id} segment={s} onEdit={startEdit} onDelete={onDelete} />
        ))}
      </section>
    </Page>
  );
}

function SegmentRow({ segment, onEdit, onDelete }: {
  segment: Segment;
  onEdit: (s: Segment) => void;
  onDelete: (s: Segment) => void;
}) {
  const { data: preview } = useQuery({
    queryKey: ['segment-preview', segment.id],
    queryFn: () => previewSegment(segment.id),
  });

  return (
    <div
      className="rounded-lg border border-border bg-background p-4 flex items-center justify-between"
      data-testid={`segment-row-${segment.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-foreground">{segment.name}</div>
        {segment.description && (
          <div className="mt-0.5 text-xs text-foreground-muted">{segment.description}</div>
        )}
        <div className="mt-1 text-xs text-foreground-muted">
          {preview
            ? `${preview.count} matching contact${preview.count === 1 ? '' : 's'}`
            : 'Calculating...'}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(segment)}>
          Edit
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(segment)}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
