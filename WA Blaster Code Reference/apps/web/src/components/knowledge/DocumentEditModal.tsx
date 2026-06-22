import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument, type DocumentDetail, type UpdateResult } from '../../api/knowledge';
import Modal from '../Modal';
import { useToast } from '../toast/ToastProvider';

interface Props {
  document: DocumentDetail | null;
  onClose: () => void;
}

export function DocumentEditModal({ document, onClose }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [contentMd, setContentMd] = useState('');

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setCategory(document.category);
      setContentMd(document.contentMd);
    }
  }, [document]);

  const saveMut = useMutation<UpdateResult, Error, void>({
    mutationFn: () => {
      if (!document) throw new Error('No document to update');
      return updateDocument(document.id, { title, category, contentMd });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      qc.invalidateQueries({ queryKey: ['knowledge', 'document', document?.id] });
      if (res.reingested) {
        showToast('Saved — content re-embedded');
      } else if (res.contentChanged) {
        showToast('Saved — re-embed scheduled', 'error');
      } else {
        showToast('Saved');
      }
      onClose();
    },
    onError: (err) => {
      showToast(err.message || 'Save failed', 'error');
    },
  });

  const canSave =
    !!document && title.trim().length > 0 && category.trim().length > 0 && contentMd.trim().length > 0;

  return (
    <Modal open={!!document} title="Edit document" onClose={onClose} size="2xl">
      {document && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="v-label">Title</label>
            <input className="v-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="v-label">Category</label>
            <input className="v-input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="v-label">
              Content (markdown){' '}
              <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>
                — saving with changes will re-chunk and re-embed
              </span>
            </label>
            <textarea
              className="v-textarea"
              rows={14}
              value={contentMd}
              onChange={(e) => setContentMd(e.target.value)}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!canSave || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
