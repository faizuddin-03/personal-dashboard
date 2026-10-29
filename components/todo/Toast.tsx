"use client";
import { Zap, PartyPopper, Info } from "lucide-react";
import clsx from "clsx";
import type { TodoToast } from "./useTodos";

export default function Toast({ toast, inline }: { toast: TodoToast | null; inline?: boolean }) {
  if (!toast) return null;
  const Icon = toast.tone === "xp" ? Zap : toast.tone === "party" ? PartyPopper : Info;
  return (
    <div
      key={toast.key}
      role="status"
      aria-live="polite"
      className={clsx(
        "pointer-events-none flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm shadow-xl shadow-black/30 bg-slate-900",
        "motion-safe:animate-[todo-pop_300ms_ease-out]",
        inline ? "absolute bottom-3 inset-x-0 mx-auto w-fit z-20" : "fixed bottom-6 right-6 z-50",
        toast.tone === "xp" ? "border-amber-500/40 text-amber-400"
          : toast.tone === "party" ? "border-green-500/40 text-green-400"
          : "border-slate-700 text-slate-300",
      )}
    >
      <Icon size={15} />
      <span className="font-medium whitespace-nowrap">{toast.text}</span>
      <style>{`@keyframes todo-pop{0%{opacity:0;transform:translateY(8px) scale(.9)}100%{opacity:1;transform:none}}`}</style>
    </div>
  );
}
