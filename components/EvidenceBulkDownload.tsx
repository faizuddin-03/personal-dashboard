"use client";
import clsx from "clsx";
import { Download, Loader2 } from "lucide-react";

// Shared bulk-download bar for every evidence list that holds more than one
// TS / run — Faizuddin, 2026-10-21: "for ALL evidence part, if got multiple
// runs, allow option to download all, pass only, fail only, selected".
// The page owns the selection (a checkbox on each TS card / past-run row,
// rendered with <EvidenceGroupCheckbox>) and the actual download; this bar
// only works out which groups each button covers.

export type EvidenceGroupStatus = "passed" | "failed" | "skipped" | "unknown";

export interface EvidenceGroup {
  /** Unique per group — the page's selection Set holds these keys. */
  key: string;
  /** TS number / run label, used in tooltips. */
  label: string;
  status: EvidenceGroupStatus;
  fileCount: number;
}

export type EvidenceDownloadMode = "all" | "passed" | "failed" | "selected";

/** Maps a Playwright test status onto the bar's pass / fail buckets. */
export function toEvidenceStatus(status: string | undefined): EvidenceGroupStatus {
  if (status === "passed") return "passed";
  if (status === "skipped") return "skipped";
  if (!status || status === "unknown") return "unknown";
  return "failed";
}

export function EvidenceGroupCheckbox({ checked, onChange, title }: { checked: boolean; onChange: () => void; title?: string }) {
  return (
    <input type="checkbox" checked={checked} onChange={onChange} onClick={e => e.stopPropagation()}
      title={title ?? "Select for bulk download"} aria-label={title ?? "Select for bulk download"}
      className="accent-indigo-600 shrink-0" />
  );
}

export default function EvidenceBulkDownload<G extends EvidenceGroup>({
  groups, selected, busy, onDownload, onClearSelection, className,
}: {
  groups: G[];
  selected: Set<string>;
  busy: boolean;
  onDownload: (groups: G[], mode: EvidenceDownloadMode) => void;
  onClearSelection?: () => void;
  className?: string;
}) {
  const withFiles = groups.filter(g => g.fileCount > 0);
  if (withFiles.length < 2) return null;

  const buckets: { mode: EvidenceDownloadMode; label: string; items: G[]; tone: string }[] = [
    { mode: "all", label: "All", items: withFiles, tone: "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600" },
    { mode: "passed", label: "Passed only", items: withFiles.filter(g => g.status === "passed"), tone: "border-green-800 text-green-300 hover:bg-green-950/40" },
    { mode: "failed", label: "Failed only", items: withFiles.filter(g => g.status === "failed"), tone: "border-red-800 text-red-300 hover:bg-red-950/40" },
    { mode: "selected", label: "Selected", items: withFiles.filter(g => selected.has(g.key)), tone: "border-slate-700 text-slate-200 hover:bg-slate-700" },
  ];

  return (
    <div className={clsx("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-[11px] text-slate-500 mr-0.5">Download</span>
      {buckets.map(b => (
        <button key={b.mode} type="button" onClick={() => onDownload(b.items, b.mode)} disabled={busy || !b.items.length}
          title={b.items.length ? `One zip each: ${b.items.map(g => g.label).join(", ")}` : `No ${b.label.toLowerCase()} evidence`}
          className={clsx("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            b.mode === "all" ? b.tone : clsx("bg-slate-800", b.tone))}>
          {busy && b.mode === "all" ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
          {b.label} ({b.items.length})
        </button>
      ))}
      {onClearSelection && selected.size > 0 && (
        <button type="button" onClick={onClearSelection} className="text-[11px] text-slate-500 hover:text-slate-300 ml-0.5">Clear</button>
      )}
    </div>
  );
}
