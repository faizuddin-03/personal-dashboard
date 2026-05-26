"use client";
import { X, Sparkles } from "lucide-react";
import { CURRENT_CHANGES, CURRENT_VERSION } from "@/lib/changelog";

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
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
        <div className="relative flex items-center justify-center px-5 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">What's New</h2>
            <span className="text-sm font-thin text-slate-500">{CURRENT_VERSION}</span>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content — only current changes since last prod push */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {CURRENT_CHANGES.length > 0 ? (
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
          ) : (
            <p className="text-sm text-slate-600 text-center py-8">No new changes since the last release.</p>
          )}
        </div>
      </div>
    </div>
  );
}
