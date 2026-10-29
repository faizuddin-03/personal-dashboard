import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  promoteCapture,
  discardCapture,
  type ResolutionCapture,
  type PromoteCaptureResult,
  type DuplicateConflictBody,
} from '../../api/captures';
import Modal from '../Modal';
import { Badge } from '../ui/Badge';
import { useToast } from '../toast/ToastProvider';

interface Props {
  capture: ResolutionCapture | null;
  onClose: () => void;
}

export function CapturePreviewModal({ capture, onClose }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [confirmingDuplicate, setConfirmingDuplicate] = useState<DuplicateConflictBody['duplicate'] | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['chatbot', 'captures'] });
    qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
  }

  const promoteMut = useMutation<PromoteCaptureResult, AxiosError, { forced?: boolean }>({
    mutationFn: ({ forced }) => {
      if (!capture) throw new Error('No capture');
      return promoteCapture(capture.id, forced ? { forcedDespiteDuplicate: true } : {});
    },
    onSuccess: () => {
      invalidate();
      showToast('Promoted to knowledge base');
      setConfirmingDuplicate(null);
      onClose();
    },
    onError: (err) => {
      const body = err.response?.data as { code?: string; duplicate?: DuplicateConflictBody['duplicate']; message?: string } | undefined;
      if (err.response?.status === 409 && body?.code === 'DUPLICATE' && body.duplicate) {
        setConfirmingDuplicate(body.duplicate);
        return;
      }
      if (body?.code === 'ALREADY_LIVE') {
        showToast('This capture is already live', 'error');
        invalidate();
        onClose();
        return;
      }
      if (body?.code === 'NOTHING_TO_PROMOTE') {
        showToast('Nothing to promote on this capture', 'error');
        return;
      }
      showToast(body?.message || err.message || 'Promote failed', 'error');
    },
  });

  const discardMut = useMutation<ResolutionCapture, AxiosError, { reason?: string }>({
    mutationFn: ({ reason }) => {
      if (!capture) throw new Error('No capture');
      return discardCapture(capture.id, reason);
    },
    onSuccess: () => {
      invalidate();
      showToast('Capture discarded');
      onClose();
    },
    onError: (err) => {
      const body = err.response?.data as { message?: string } | undefined;
      showToast(body?.message || err.message || 'Discard failed', 'error');
    },
  });

  const isPending = capture?.status === 'pending';

  return (
    <Modal open={!!capture} title="Captured Q&A" onClose={onClose} size="2xl">
      {capture && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone="neutral">{capture.status}</Badge>
            <Badge tone="neutral">{capture.disposition}</Badge>
            {capture.document && <Badge tone="neutral">{capture.document.category}</Badge>}
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              closed {new Date(capture.closedAt).toLocaleString('en-GB')}
            </span>
            {capture.failureReason && (
              <span style={{ fontSize: 11.5, color: 'var(--red-500, #ef4444)' }}>
                failed: {capture.failureReason}
              </span>
            )}
          </div>

          {capture.document && (
            <div style={{ fontSize: 14, fontWeight: 600 }}>{capture.document.title}</div>
          )}

          {capture.conversation && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              From conversation with{' '}
              <b>{capture.conversation.contact?.name ?? 'unknown contact'}</b>{' '}
              <span className="mono" style={{ fontSize: 11 }}>
                conv: {capture.conversationId.substring(0, 8)}…
              </span>
            </div>
          )}

          {capture.resolutionNotes && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Notes: {capture.resolutionNotes}
            </div>
          )}

          {confirmingDuplicate && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--human-soft)',
                border: '1px solid var(--human-soft-line)',
                fontSize: 12.5,
              }}
            >
              A LIVE document similar to this already exists:{' '}
              <b>{confirmingDuplicate.documentTitle}</b> (similarity{' '}
              {Math.round(confirmingDuplicate.similarityScore * 100)}%). Promote anyway?
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmingDuplicate(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={promoteMut.isPending}
                  onClick={() => promoteMut.mutate({ forced: true })}
                >
                  Promote anyway
                </button>
              </div>
            </div>
          )}

          {!confirmingDuplicate && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button
                className="btn btn-ghost"
                disabled={discardMut.isPending || !isPending}
                onClick={() => {
                  const reason = window.prompt('Reason for discarding (optional):') || undefined;
                  discardMut.mutate({ reason });
                }}
              >
                Discard
              </button>
              <button
                className="btn btn-primary"
                disabled={promoteMut.isPending || !capture.documentId || capture.status === 'captured_live'}
                onClick={() => promoteMut.mutate({})}
              >
                {promoteMut.isPending ? 'Promoting…' : 'Promote to LIVE'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
