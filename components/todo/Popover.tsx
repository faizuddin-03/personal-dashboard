"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

/** Small click-to-open menu. Closes on outside click, Escape, or `close()`. */
export default function Popover({ label, icon, children, align = "right", className, buttonClassName, title }: {
  label?: ReactNode;
  icon?: ReactNode;
  title: string;
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={clsx(
          "flex items-center gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          buttonClassName ?? "p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800",
          open && "bg-slate-800 text-slate-200",
        )}
      >
        {icon}{label}
      </button>
      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute top-full mt-1 z-40 min-w-44 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-xl shadow-black/40 p-1.5",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onClick, children, active, danger }: {
  onClick: () => void; children: ReactNode; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        danger ? "text-red-400 hover:bg-red-500/10" : active ? "bg-slate-800 text-slate-100" : "text-slate-300 hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}
