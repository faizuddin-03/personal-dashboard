"use client";
import { X, Sparkles, Package } from "lucide-react";
import {
  RELEASED_VERSIONS,
  CURRENT_CHANGES,
  CURRENT_VERSION,
} from "@/lib/changelog";

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  const fmtDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-100">What's New</h2>
            <span className="text-xs font-thin text-slate-500">{CURRENT_VERSION}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Current / upcoming changes */}
          {CURRENT_CHANGES.length > 0 && (
            <section>
              <ul className="space-y-3">
                {CURRENT_CHANGES.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 leading-snug">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{change.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{change.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Past released versions */}
          {RELEASED_VERSIONS.length > 0 && (
            <>
              {CURRENT_CHANGES.length > 0 && <hr className="border-slate-800" />}
              {[...RELEASED_VERSIONS].reverse().map(v => (
                <section key={v.version}>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={13} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {v.label}
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">{fmtDate(v.date)}</span>
                  </div>
                  <ul className="space-y-3">
                    {v.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-400">{change.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{change.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}

          {CURRENT_CHANGES.length === 0 && RELEASED_VERSIONS.length === 0 && (
            <p className="text-sm text-slate-600 text-center py-8">No changes recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
