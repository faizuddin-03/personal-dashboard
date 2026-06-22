import { ReactNode, useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: ModalSize;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({ open, title, children, onClose, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} overflow-hidden rounded-lg border border-border bg-background`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="text-foreground-muted hover:text-foreground leading-none" aria-label="close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
