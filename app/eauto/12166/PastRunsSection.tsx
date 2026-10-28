"use client";
import { useEffect, useState } from "react";
import {
  ChevronDown, ChevronRight, RefreshCw, AlertTriangle, Loader2, History, CheckCircle2, XCircle,
  Download, Film, Image as ImageIcon, FileArchive,
} from "lucide-react";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";

// Collapsible "Past runs" list for the 12166 E2E and User Access Regression
// tabs — same look and behaviour as the Past runs section on the queue pages
// (app/eauto/12107/page.tsx): one row per run folder under
// public/qa-artifacts/<project>/, per-run "All" zip, per-test-folder zip,
// per-file download, and the All / Passed only / Failed only / Selected bar.

interface HistoryEvidenceItem { label: string; url: string; kind: "video" | "image" | "trace" | "file" }
interface HistoryRun { runId: string; runLabel: string; timestamp: number; scenarios: string[]; evidence: HistoryEvidenceItem[]; status?: EvidenceGroupStatus }

/** Top-level per-test folder of an evidence label ("TS01/TS01.webm" -> "TS01"); "" = run root. */
const folderOf = (e: HistoryEvidenceItem) => (e.label.includes("/") ? e.label.split("/")[0] : "");

export default function PastRunsSection({
  historyUrl, downloadUrl, zipPrefix, currentRunId, refreshKey,
}: {
  historyUrl: string;
  /** Existing download-all route — accepts { runId, folders? }. */
  downloadUrl: string;
  /** Set: zips are "<prefix>-<runId>.zip". Unset: "<runLabel>.zip" (the TS numbers). */
  zipPrefix?: string;
  /** The run shown above, marked "current" in the list. */
  currentRunId?: string;
  /** Changes when a new run finishes, so an open list reloads. */
  refreshKey?: string;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(historyUrl);
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      const data = await r.json() as { runs: HistoryRun[] };
      setHistory(data.runs); setLoaded(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load past runs."); }
    finally { setLoading(false); }
  }

  function toggleSection() {
    const aboutToExpand = collapsed;
    setCollapsed(!collapsed);
    if (aboutToExpand && !loaded) load();
  }

  // A run that finished while the list is open shows up without a manual
  // Refresh. Quiet reload: state is only set once the fetch answers.
  useEffect(() => {
    if (!loaded || !refreshKey) return;
    let cancelled = false;
    fetch(historyUrl)
      .then(r => (r.ok ? r.json() as Promise<{ runs: HistoryRun[] }> : null))
      .then(data => { if (data && !cancelled) setHistory(data.runs); })
      .catch(() => { /* manual Refresh still available */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const togglePick = (key: string) => setPicked(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  async function downloadZip(runId: string, zipName: string, folders?: string[]) {
    const r = await fetch(downloadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, ...(folders ? { folders } : {}) }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error ?? `Download failed (${r.status})`);
    }
    const blob = await r.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl; a.download = zipName;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function download(items: { runId: string; zipName: string; folders?: string[] }[]) {
    setDownloading(true); setDownloadError("");
    try {
      for (const it of items) await downloadZip(it.runId, it.zipName, it.folders);
    } catch (e) { setDownloadError(e instanceof Error ? e.message : "Failed to download evidence."); }
    finally { setDownloading(false); }
  }

  const zipFor = (h: HistoryRun) => (zipPrefix ? `${zipPrefix}-${h.runId}.zip`
    : /^[\w-]+$/.test(h.runLabel) ? `${h.runLabel}.zip` : `evidence-${h.runId}.zip`);
  const groups: (EvidenceGroup & { runId: string })[] = history.map(h => ({
    key: h.runId, label: h.runLabel, status: h.status ?? "unknown", fileCount: h.evidence.length, runId: h.runId,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div role="button" tabIndex={0} onClick={toggleSection} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection(); } }}
        className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 text-left hover:bg-slate-800/30 cursor-pointer">
        {collapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">
          Past runs <span className="text-slate-600 normal-case tracking-normal">· evidence kept across runs</span>
        </span>
        <span onClick={e => e.stopPropagation()} className="flex items-center gap-3">
          <button onClick={() => load()} disabled={loading} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 disabled:opacity-50">
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />Refresh
          </button>
        </span>
      </div>
      {!collapsed && (
        <div className="p-4">
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400 mb-3"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
          {loading && !history.length && <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Loading past runs…</p>}
          {!loading && loaded && !history.length && <p className="text-xs text-slate-500">No past runs found yet.</p>}
          <EvidenceBulkDownload groups={groups} selected={picked} busy={downloading} className="mb-3"
            onDownload={g => download(g.map(x => { const h = history.find(r => r.runId === x.runId)!; return { runId: h.runId, zipName: zipFor(h) }; }))}
            onClearSelection={() => setPicked(new Set())} />
          {downloadError && <p className="text-[11px] text-red-400 mb-3">{downloadError}</p>}
          <div className="space-y-2">
            {history.map(h => {
              const isOpen = expandedRun === h.runId;
              const isCurrent = h.runId === currentRunId;
              const folders = Array.from(new Set(h.evidence.map(folderOf)));
              return (
                <div key={h.runId} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div role="button" tabIndex={0} onClick={() => setExpandedRun(isOpen ? null : h.runId)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedRun(isOpen ? null : h.runId); } }}
                    className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800/40">
                    <EvidenceGroupCheckbox checked={picked.has(h.runId)} onChange={() => togglePick(h.runId)} />
                    {isOpen ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
                    <History size={13} className="text-slate-500 shrink-0" />
                    <span className="text-xs font-mono text-slate-300 break-all">{h.runLabel}</span>
                    {h.status === "passed" && <CheckCircle2 size={12} className="text-green-400 shrink-0" />}
                    {h.status === "failed" && <XCircle size={12} className="text-red-400 shrink-0" />}
                    {isCurrent && <span className="text-[10px] font-medium text-indigo-400 border border-indigo-800 rounded px-1.5 py-0.5">current</span>}
                    <span className="text-[11px] text-slate-600 shrink-0">{new Date(h.timestamp).toLocaleString()}</span>
                    <span className="text-[11px] text-slate-600 shrink-0">· {h.evidence.length} file{h.evidence.length === 1 ? "" : "s"}</span>
                    <div className="flex-1" />
                    <button onClick={e => { e.stopPropagation(); download([{ runId: h.runId, zipName: zipFor(h) }]); }} disabled={downloading || !h.evidence.length}
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"><Download size={11} />All</button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-800">
                      {folders.map(folder => {
                        const items = h.evidence.filter(e => folderOf(e) === folder);
                        return (
                          <div key={folder || "_root"} className="border-b border-slate-800/70 last:border-b-0">
                            {folder && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30">
                                <span className="text-[11px] font-mono font-semibold text-slate-400 flex-1 break-all">{folder}</span>
                                <button onClick={() => download([{ runId: h.runId, zipName: `${folder}.zip`, folders: [folder] }])} disabled={downloading}
                                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50 transition-colors shrink-0"><Download size={11} />{folder} evidence</button>
                              </div>
                            )}
                            {items.map(e => (
                              <div key={e.url} className="px-3 py-2 flex items-center gap-3">
                                {e.kind === "video" ? <Film size={12} className="text-slate-500 shrink-0" />
                                  : e.kind === "image" ? <ImageIcon size={12} className="text-slate-500 shrink-0" />
                                    : <FileArchive size={12} className="text-slate-500 shrink-0" />}
                                <span className="text-xs font-mono text-slate-300 flex-1 truncate">{folder ? e.label.slice(folder.length + 1) : e.label}</span>
                                <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors shrink-0"><Download size={11} />Download</a>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
