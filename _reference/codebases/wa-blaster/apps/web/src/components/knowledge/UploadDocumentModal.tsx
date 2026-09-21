import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument, type KnowledgeDocument } from '../../api/knowledge';
import Modal from '../Modal';
import { useToast } from '../toast/ToastProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  existingCategories: string[];
}

function previewTitleFromMarkdown(md: string, fallback: string): string {
  const h1 = md.match(/^#\s+(.+?)\s*$/m);
  return h1 ? h1[1].trim() : fallback.replace(/\.(md|markdown)$/i, '');
}

export function UploadDocumentModal({ open, onClose, existingCategories }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setCategory('');
    setPreviewTitle(null);
    setClientError(null);
  }

  async function onFile(f: File) {
    setClientError(null);
    setFile(f);
    const lower = f.name.toLowerCase();
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) {
      setClientError('Only .md or .markdown files are accepted');
      setPreviewTitle(null);
      return;
    }
    if (f.size >= 1024 * 1024) {
      setClientError('File must be smaller than 1MB');
      setPreviewTitle(null);
      return;
    }
    try {
      const text = await f.text();
      setPreviewTitle(previewTitleFromMarkdown(text, f.name));
    } catch {
      setClientError('Could not read file as text');
    }
  }

  const uploadMut = useMutation<KnowledgeDocument, Error, void>({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return uploadDocument(file, category.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      showToast('Uploaded as draft — switch to "Draft" to review and publish');
      reset();
      onClose();
    },
    onError: (err) => {
      const anyErr = err as { response?: { data?: { message?: string } } };
      showToast(anyErr.response?.data?.message || err.message || 'Upload failed', 'error');
    },
  });

  return (
    <Modal
      open={open}
      title="Upload markdown document"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 480 }}>
        <div>
          <label className="v-label">File (.md or .markdown, &lt; 1MB)</label>
          <input
            type="file"
            accept=".md,.markdown,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
        {previewTitle && (
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Will be titled: <b>{previewTitle}</b>
          </div>
        )}
        {clientError && (
          <div style={{ fontSize: 12, color: 'var(--red-500, #ef4444)' }}>{clientError}</div>
        )}
        <div>
          <label className="v-label">Category</label>
          <input
            className="v-input"
            list="upload-category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="General"
          />
          <datalist id="upload-category-options">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!file || !!clientError || uploadMut.isPending}
            onClick={() => uploadMut.mutate()}
          >
            {uploadMut.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
