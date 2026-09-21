import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export interface ToastAction { label: string; onClick: () => void }
export interface ToastOpts { variant?: ToastVariant; action?: ToastAction; durationMs?: number }
interface ToastItem { id: string; message: string; variant: ToastVariant; action?: ToastAction; durationMs: number }

interface ToastCtx {
  showToast: (message: string, opts?: ToastVariant | ToastOpts) => string;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-500/30 bg-red-50 text-red-500',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
};
const BAR_STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, opts?: ToastVariant | ToastOpts) => {
    const o: ToastOpts = typeof opts === 'string' ? { variant: opts } : (opts ?? {});
    counter.current += 1;
    const id = `t${counter.current}`;
    const item: ToastItem = {
      id, message,
      variant: o.variant ?? 'success',
      action: o.action,
      durationMs: o.durationMs ?? 4000,
    };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => dismiss(id), item.durationMs);
    return id;
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ showToast, dismiss }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto relative w-72 overflow-hidden rounded-md border px-4 py-2.5 text-[13px] shadow-lg ${VARIANT_STYLES[t.variant]}`}
              role="status"
              data-testid={`toast-${t.variant}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex-1">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    className="shrink-0 font-semibold underline underline-offset-2"
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    data-testid="toast-action"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="dismiss"
                  className="shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => dismiss(t.id)}
                >
                  ×
                </button>
              </div>
              <span
                className={`absolute bottom-0 left-0 h-0.5 ${BAR_STYLES[t.variant]}`}
                style={{ animation: `toast-countdown ${t.durationMs}ms linear forwards` }}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
