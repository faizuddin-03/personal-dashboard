"use client";
// Collapsible card used by the pipeline workspace (Faizuddin, 2026-10-27).
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

export default function Panel({ title, icon, right, defaultOpen = true, children, className }: {
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={clsx("bg-slate-900 border border-slate-800 rounded-xl", className)}>
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm font-semibold text-slate-100"
        >
          {icon}
          <span className="truncate">{title}</span>
          <ChevronDown size={14} className={clsx("ml-auto text-slate-500 transition-transform", !open && "-rotate-90")} aria-hidden />
        </button>
        {right}
      </header>
      {open && <div className="p-4">{children}</div>}
    </section>
  );
}
