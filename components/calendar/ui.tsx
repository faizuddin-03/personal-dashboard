"use client";
// Small shared pieces for the calendar: form classes, Jira chip, the
// slide-over shell and the inline Yes/No confirm.

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export const lbl = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
export const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent,#3b82f6)] focus:border-transparent";
export const sel = inp;
export const btnGhost = "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 motion-safe:transition-colors";
export const btnOutline = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 motion-safe:transition-colors";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[color:var(--accent,#3b82f6)] hover:bg-[color:var(--accent-hover,#2563eb)] disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition-colors";

export function JiraChip({ k, onClick }: { k: string; onClick?: () => void }) {
  return (
    <Link
      href={`/jira/${encodeURIComponent(k)}`}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border border-slate-700 text-slate-300 hover:border-[color:var(--accent,#3b82f6)] hover:text-slate-100 motion-safe:transition-colors"
    >
      {k}
    </Link>
  );
}

export function Dot({ hex, className }: { hex: string; className?: string }) {
  return <span className={clsx("inline-block rounded-full shrink-0", className ?? "w-2 h-2")} style={{ background: hex }} />;
}

/** Right-hand slide-over panel (full width on phones). Esc closes. */
export function SidePanel({ title, icon, accent, onClose, children, footer }: {
  title: ReactNode;
  icon?: ReactNode;
  accent?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[95] flex justify-end" role="dialog" aria-modal="true">
      <div
        className={clsx("absolute inset-0 bg-black/40 motion-safe:transition-opacity motion-safe:duration-200", shown ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col",
          "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
          shown ? "translate-x-0" : "translate-x-full motion-reduce:translate-x-0",
        )}
      >
        {accent && <div className="h-1 shrink-0" style={{ background: accent }} />}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800 shrink-0">
          {icon}
          <h2 className="flex-1 min-w-0 text-sm font-semibold text-slate-200 truncate">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-800 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

/** Delete button that turns into an inline "Delete? Yes / No". */
export function ConfirmDelete({ onConfirm, label = "Delete", question = "Delete?" }: { onConfirm: () => void; label?: string; question?: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button onClick={() => setAsking(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-400 hover:bg-red-950/30 motion-safe:transition-colors">
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-slate-400">{question}</span>
      <button onClick={onConfirm} className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold">Yes</button>
      <button onClick={() => setAsking(false)} className="px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800">No</button>
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = "sm" }: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "xs";
}) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
      {options.map(o => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-md font-medium motion-safe:transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
            value === o.value ? "bg-slate-700 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-300",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
