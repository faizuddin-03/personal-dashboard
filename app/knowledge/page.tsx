"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Library, Loader2, AlertCircle, Save, Eye, Pencil, RefreshCw, FileText, RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import MarkdownLite from "@/components/MarkdownLite";

interface FileMeta {
  name: string;
  title: string;
  lines: number;
  tagged: number;
  updatedAt: string;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function KnowledgePage() {
  const [files, setFiles]     = useState<FileMeta[]>([]);
  const [active, setActive]   = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const dirty = editing && content !== original;

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/knowledge");
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setFiles(data.files ?? []);
      setActive(prev => prev ?? data.files?.[0]?.name ?? null);
    } catch {
      setError("Could not reach the knowledge API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Load the selected file's content.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`/api/knowledge?file=${encodeURIComponent(active)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.error) { setError(data.error); return; }
        setContent(data.content ?? "");
        setOriginal(data.content ?? "");
        setEditing(false);
        setSavedAt(null);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not load that file.");
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  // Warn before losing unsaved edits on tab close / reload.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function selectFile(name: string) {
    if (name === active) return;
    if (dirty && !confirm("You have unsaved changes. Discard them?")) return;
    setActive(name);
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: active, content }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOriginal(content);
      setSavedAt(data.updatedAt);
      setEditing(false);
      loadList();
    } catch {
      setError("Save failed — the file was not written.");
    } finally {
      setSaving(false);
    }
  }

  const activeMeta = files.find(f => f.name === active);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Library size={15} className="text-blue-400 shrink-0" />
          <h1 className="text-sm font-semibold text-slate-200 shrink-0">Knowledge Base</h1>
          <span className="text-[11px] text-slate-600 hidden sm:block truncate">
            knowledge/ — read by the AI assistant each session
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirty && <span className="text-[11px] text-amber-400 hidden sm:block">Unsaved changes</span>}
          {savedAt && !dirty && <span className="text-[11px] text-green-500 hidden sm:block">Saved</span>}

          {active && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}

          {editing && (
            <>
              <button
                onClick={() => { setContent(original); setEditing(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw size={12} /> Discard
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <Eye size={12} /> Preview
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </>
          )}

          <button
            onClick={loadList}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Reload from disk"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* File list */}
        <aside className="lg:w-64 lg:shrink-0 lg:border-r border-b lg:border-b-0 border-slate-800 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] overflow-y-auto p-2 space-y-1">
          {files.map(f => {
            const isActive = f.name === active;
            return (
              <button
                key={f.name}
                onClick={() => selectFile(f.name)}
                className={clsx(
                  "w-full text-left p-2.5 rounded-lg border transition-colors",
                  isActive ? "bg-blue-600/10 border-blue-600/40" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText size={12} className={isActive ? "text-blue-400 shrink-0" : "text-slate-600 shrink-0"} />
                  <p className={clsx("text-xs font-medium truncate", isActive ? "text-blue-300" : "text-slate-300")}>
                    {f.title}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-slate-600 mt-1 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {f.lines} lines · {f.tagged} sourced · {relativeTime(f.updatedAt)}
                </p>
              </button>
            );
          })}
          {!loading && files.length === 0 && !error && (
            <p className="text-xs text-slate-600 p-3 text-center">No files in knowledge/.</p>
          )}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 py-5">
          {error && (
            <div className="flex items-start gap-3 p-4 mb-4 bg-red-950/30 border border-red-800/40 rounded-xl">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {loading && !content && (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-600">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading knowledge base…</span>
            </div>
          )}

          {active && (
            <>
              {editing ? (
                <div className="max-w-4xl">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    spellCheck={false}
                    className="w-full h-[calc(100vh-11rem)] bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 leading-relaxed resize-none focus:outline-none focus:border-blue-600/60"
                  />
                  <p className="text-[10px] text-slate-600 mt-2">
                    Markdown. Keep a provenance tag on every fact — <code className="text-slate-500">`[verified: path · symbol]`</code>,
                    {" "}<code className="text-slate-500">`[verified live: env, date]`</code>,
                    {" "}<code className="text-slate-500">`[from ticket KEY]`</code> or
                    {" "}<code className="text-slate-500">`[unconfirmed]`</code>. Saving writes straight to {activeMeta?.name}.
                  </p>
                </div>
              ) : (
                <article className="max-w-3xl">
                  <MarkdownLite source={content} />
                </article>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
