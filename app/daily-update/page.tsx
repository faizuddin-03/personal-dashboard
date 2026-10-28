"use client";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Plus, X, ChevronUp, ChevronDown, Sparkles, Loader2, SidebarOpen, History, Trash2, ChevronLeft, CalendarCheck, RotateCcw, Save } from "lucide-react";
import { useApp } from "@/components/AppShell";
import { getGeminiKey } from "@/components/SettingsModal";
import { getKanbanState, KanbanCard } from "@/lib/kanban";
import { fetchCompletedToday, fetchRaisedOn } from "@/lib/todayActivity";
import clsx from "clsx";

// ── TS Tracker types (duplicated to avoid a cross-page import) ────
interface TSCase  { status: "pass" | "fail" | "in-progress" | null; disabled?: boolean; }
interface TSSuite { cases: TSCase[]; }
interface CREntry { id: string; crKey: string; crSummary: string; suites: TSSuite[]; }

function loadTSData(): CREntry[] {
  try { return JSON.parse(localStorage.getItem("test_tracker_crs") ?? "[]"); } catch { return []; }
}

function tsProgress(crKey: string, tsData: CREntry[]): string {
  const entry = tsData.find(e => e.crKey === crKey);
  if (!entry) return "TBC";
  const cases = entry.suites.flatMap(s => s.cases).filter(c => !c.disabled);
  if (cases.length === 0) return "TBC";
  const passed  = cases.filter(c => c.status === "pass").length;
  const failed  = cases.filter(c => c.status === "fail").length;
  const pct     = ((passed / cases.length) * 100).toFixed(1).replace(/\.0$/, "");
  const suffix  = failed === 0 && passed > 0 ? " - PASS only" : failed > 0 ? " - With failures" : "";
  if (passed === cases.length) return `${passed}/${cases.length} (100%) - Done${suffix === " - PASS only" ? " - PASS only" : ""}`;
  return `${passed}/${cases.length} (${pct}%)${suffix}`;
}

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

function formatDate(d: Date): string {
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 || 12;
  return `${h12}.${String(m).padStart(2, "0")} ${period}`;
}

// ── CR row state ───────────────────────────────────────────────────
interface CRRow {
  id: string;
  key: string;       // editable jira key(s) display e.g. "EAINT-9860"
  title: string;     // editable short title
  statusLines: string; // free-text status notes (one per line)
  progress: string;  // auto-filled but editable
}

function buildRows(cards: KanbanCard[], tsData: CREntry[]): CRRow[] {
  return cards
    .filter(c => c.boardType === "cr" && c.jiraKey)
    .map(c => ({
      id:          c.id,
      key:         c.jiraKey!,
      title:       c.title,
      statusLines: "",
      progress:    tsProgress(c.jiraKey!, tsData),
    }));
}

// ── Local storage: draft + history ───────────────────────────────
const DRAFT_KEY   = "daily_update_draft";
const HISTORY_KEY = "daily_update_history";

interface DraftState {
  type: "todo" | "eod";
  date: string;
  hour: number;
  min: number;
  rows: CRRow[];
}

interface HistoryEntry {
  id: string;
  savedAt: string;          // ISO timestamp
  date: string;             // DD-MM-YYYY, the post's own date
  type: "todo" | "eod";
  text: string;
}

function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as DraftState;
    return Array.isArray(d?.rows) ? d : null;
  } catch { return null; }
}

function saveDraft(d: DraftState) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* storage unavailable */ }
}

function loadHistory(): HistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveHistory(items: HistoryEntry[]): boolean {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); return true; } catch { return false; }
}

// ── Generate formatted Teams markdown ────────────────────────────
function generateText(
  name: string,
  type: "todo" | "eod",
  date: string,
  time: string,
  rows: CRRow[],
): string {
  const typeLabel = type === "todo" ? "To Do Plan" : "EOD Update";
  const header    = `**${name} - ${typeLabel} (${date} ${time}):**`;

  const sections = rows.map((r, idx) => {
    const lines: string[] = [];

    // Numbered bold title
    lines.push(`${idx + 1}. **${r.key} - ${r.title}**`);

    // JIRA Ticket
    lines.push(`   - JIRA Ticket : ${r.key}`);

    // Status block
    lines.push(`   - Status :`);
    if (r.statusLines.trim()) {
      r.statusLines.split("\n").forEach(l => {
        if (!l.trim()) return;
        const indent = l.match(/^(\s*)/)?.[1].length ?? 0;
        if (indent >= 2) {
          lines.push(`         - ${l.trim()}`);  // sub-bullet
        } else {
          lines.push(`     - ${l.trim()}`);       // first-level bullet
        }
      });
    }

    // Overall CR Testing Progress — multi-line becomes sub-bullets
    const progressLines = r.progress.split("\n").map(l => l.trim()).filter(Boolean);
    if (progressLines.length > 1) {
      lines.push(`   - Overall CR Testing Progress :`);
      progressLines.forEach(l => lines.push(`     - **${l}**`));
    } else {
      lines.push(`   - Overall CR Testing Progress : **${r.progress}**`);
    }

    return lines.join("\n");
  });

  return [header, "", ...sections].join("\n\n");
}

// ── Page ──────────────────────────────────────────────────────────
export default function DailyUpdatePage() {
  const { creds } = useApp();

  const now  = new Date();
  const [type,  setType]  = useState<"todo" | "eod">("todo");
  const [date,  setDate]  = useState(formatDate(now));
  const [hour,  setHour]  = useState(now.getHours());
  const [min,   setMin]   = useState(Math.round(now.getMinutes() / 5) * 5 % 60);
  const [rows,  setRows]  = useState<CRRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [inserting, setInserting] = useState(false);

  // History
  const [sideTab, setSideTab] = useState<"preview" | "history">("preview");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  const name = creds?.email ? firstNameFromEmail(creds.email) : "Faizuddin";

  const flash = useCallback((tone: "ok" | "error" | "info", text: string) => {
    setMessage({ tone, text });
  }, []);

  function rowsFromKanban(): CRRow[] {
    try {
      const cards = getKanbanState().ongoing as KanbanCard[];
      return buildRows(cards, loadTSData());
    } catch { return []; }
  }

  // Restore the saved draft, or start from the Kanban On-Going CR cards
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setType(draft.type === "eod" ? "eod" : "todo");
      if (draft.date) setDate(draft.date);
      if (Number.isFinite(draft.hour)) setHour(draft.hour);
      if (Number.isFinite(draft.min)) setMin(draft.min);
      setRows(draft.rows);
    } else {
      setRows(rowsFromKanban());
    }
    setHistory(loadHistory());
    setDraftLoaded(true);
  }, []);

  // Persist the draft on every change (after the initial restore)
  useEffect(() => {
    if (!draftLoaded) return;
    saveDraft({ type, date, hour, min, rows });
  }, [draftLoaded, type, date, hour, min, rows]);

  function resetFromKanban() {
    setRows(rowsFromKanban());
    setConfirmReset(false);
    flash("info", "Rows reloaded from Kanban On-Going CR cards.");
  }

  async function insertTodayTickets() {
    if (!creds) { flash("error", "Connect Jira in Settings first."); return; }
    setInserting(true);
    try {
      const [completedRes, raisedRes] = await Promise.allSettled([fetchCompletedToday(creds), fetchRaisedOn(creds)]);
      const errors: string[] = [];
      if (completedRes.status === "rejected") errors.push(`Completed today: ${completedRes.reason instanceof Error ? completedRes.reason.message : "failed"}`);
      if (raisedRes.status === "rejected") errors.push(`Raised today: ${raisedRes.reason instanceof Error ? raisedRes.reason.message : "failed"}`);
      const completed = completedRes.status === "fulfilled" ? completedRes.value : [];
      const raised    = raisedRes.status === "fulfilled" ? raisedRes.value : [];

      const tsData = loadTSData();
      const items: { key: string; summary: string; line: string }[] = [
        ...completed.map(i => ({ key: i.key, summary: i.fields.summary, line: `Completed today - ${i.fields.status.name}` })),
        ...raised.map(i => ({ key: i.key, summary: i.fields.summary, line: "Raised today" })),
      ];
      // Merge: an existing row for the key gets a status line; otherwise a new row
      const newRows: CRRow[] = [];
      const extraLines = new Map<string, string[]>();
      for (const it of items) {
        const k = it.key.toUpperCase();
        const fresh = newRows.find(r => r.key.toUpperCase() === k);
        if (fresh) { if (!fresh.statusLines.split("\n").includes(it.line)) fresh.statusLines += `\n${it.line}`; continue; }
        if (rows.some(r => r.key.trim().toUpperCase() === k)) {
          extraLines.set(k, [...(extraLines.get(k) ?? []), it.line]);
          continue;
        }
        newRows.push({ id: crypto.randomUUID(), key: it.key, title: it.summary, statusLines: it.line, progress: tsProgress(it.key, tsData) });
      }
      setRows(prev => [
        ...prev.map(r => {
          const lines = (extraLines.get(r.key.trim().toUpperCase()) ?? [])
            .filter(l => !r.statusLines.split("\n").some(x => x.trim() === l));
          if (lines.length === 0) return r;
          return { ...r, statusLines: [r.statusLines.trimEnd(), ...lines].filter(Boolean).join("\n") };
        }),
        ...newRows,
      ]);
      if (errors.length) flash("error", errors.join(" · "));
      else if (items.length === 0) flash("info", "No tickets completed or raised today.");
      else flash("ok", `Inserted ${completed.length} completed and ${raised.length} raised ticket(s).`);
    } finally {
      setInserting(false);
    }
  }

  const updateRow = useCallback((id: string, patch: Partial<CRRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      key: "", title: "", statusLines: "", progress: "TBC",
    }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const moveRow = useCallback((id: string, dir: -1 | 1) => {
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const draftWithAI = useCallback(async (r: CRRow) => {
    const key = getGeminiKey();
    if (!key) { flash("error", "Add your Gemini API key in Settings first."); return; }
    setDraftingId(r.id);
    try {
      const updateLabel = type === "todo" ? "To Do Plan (what I plan to do today)" : "EOD Update (what I accomplished today)";
      const prompt = `You are helping a QA engineer write their daily Microsoft Teams standup update.

Update type: ${updateLabel}
CR / Ticket: ${r.key} — ${r.title}
Overall TS Progress: ${r.progress}

Write 1–3 concise status bullet points for the "Status" field. Rules:
- Plain text only, no markdown asterisks or symbols
- Each top-level point on its own line
- If a point has sub-details, put them on the next line(s) indented with exactly 2 spaces
- Be brief and professional, like a QA engineer would say at standup
- Do not repeat the ticket number or title in every line
- Output only the bullet lines, nothing else`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      if (text) updateRow(r.id, { statusLines: text });
      else flash("error", "Gemini returned no text.");
    } catch (e) {
      flash("error", `Gemini error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDraftingId(null);
    }
  }, [type, updateRow, flash]);

  const timeStr = formatTime(hour, min);
  const preview = generateText(name, type, date, timeStr, rows);

  /** Adds the current post to history. Skips an exact repeat of the newest entry. */
  function saveToHistory(): boolean {
    const current = loadHistory();
    if (current[0]?.text === preview) { setHistory(current); return true; }
    const entry: HistoryEntry = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), date, type, text: preview };
    const next = [entry, ...current];
    const ok = saveHistory(next);
    setHistory(ok ? next : current);
    return ok;
  }

  function copy() {
    const saved = saveToHistory();
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (!saved) flash("error", "Copied, but could not save to history (storage unavailable).");
    }).catch(() => flash("error", "Clipboard copy failed. Select the preview text and copy it manually."));
  }

  function saveOnly() {
    if (saveToHistory()) flash("ok", "Saved to history.");
    else flash("error", "Could not save to history (storage unavailable).");
  }

  function copyHistory(h: HistoryEntry) {
    navigator.clipboard.writeText(h.text).then(() => {
      setCopiedHistoryId(h.id);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    }).catch(() => flash("error", "Clipboard copy failed."));
  }

  function deleteHistory(id: string) {
    const next = history.filter(h => h.id !== id);
    if (!saveHistory(next)) { flash("error", "Could not delete (storage unavailable)."); return; }
    setHistory(next);
    setConfirmDeleteId(null);
    if (viewingId === id) setViewingId(null);
  }

  const viewing = viewingId ? history.find(h => h.id === viewingId) ?? null : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-200">Daily Update</h1>
          <p className="text-xs text-slate-500 italic font-normal hidden sm:block">Generate your Teams To Do Plan or EOD Update</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPreview(v => !v)}
            className={clsx(
              "sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              showPreview
                ? "bg-slate-700 text-slate-200 border-slate-600"
                : "bg-slate-800/60 text-slate-400 border-slate-700"
            )}
          >
            <SidebarOpen size={13} />
            Preview
          </button>
          <button
            onClick={saveOnly}
            title="Save this post to history without copying"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-500 transition-colors"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={copy}
            title="Copy to clipboard and save to history"
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              copied
                ? "bg-green-700/30 text-green-400 border border-green-700/50"
                : "bg-blue-600/20 text-blue-400 border border-blue-700/50 hover:bg-blue-600/30"
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy to clipboard"}</span>
            <span className="sm:hidden">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — editor (hidden on mobile when preview is shown) */}
        <div className={clsx("flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6", showPreview && "hidden sm:block")}>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              {(["todo", "eod"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={clsx(
                    "px-3 py-1 text-xs rounded-md transition-colors",
                    type === t ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                  )}>
                  {t === "todo" ? "To Do Plan" : "EOD Update"}
                </button>
              ))}
            </div>

            {/* Date */}
            <input
              type="date"
              value={date.split("-").reverse().join("-")}
              onChange={e => {
                const [y, m, d] = e.target.value.split("-");
                setDate(`${d}-${m}-${y}`);
              }}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-blue-600 [color-scheme:dark]"
            />

            {/* Time */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
              <input type="number" min={0} max={23} value={hour}
                onChange={e => setHour(Number(e.target.value) % 24)}
                className="w-8 text-xs bg-transparent text-slate-300 focus:outline-none text-center" />
              <span className="text-slate-600 text-xs">:</span>
              <input type="number" min={0} max={59} value={String(min).padStart(2, "0")}
                onChange={e => setMin(Number(e.target.value) % 60)}
                className="w-8 text-xs bg-transparent text-slate-300 focus:outline-none text-center" />
              <span className="text-xs text-slate-500">{hour >= 12 ? "PM" : "AM"}</span>
            </div>

            {/* Insert today's Jira activity */}
            <button
              onClick={insertTodayTickets}
              disabled={inserting}
              title="Add tickets you completed or raised today (same data as the home page widgets)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 hover:border-green-700/60 hover:text-green-300 disabled:opacity-50 transition-colors"
            >
              {inserting ? <Loader2 size={12} className="animate-spin" /> : <CalendarCheck size={12} />}
              Insert today&apos;s tickets
            </button>

            {/* Reload rows from Kanban (inline confirm) */}
            {confirmReset ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-400">Replace all rows?</span>
                <button onClick={resetFromKanban} className="px-2 py-1 rounded-lg border border-amber-700/60 text-amber-300 hover:bg-amber-900/20">Yes</button>
                <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200">No</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                title="Rebuild rows from Kanban On-Going CR cards"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                <RotateCcw size={12} />
                Reload from Kanban
              </button>
            )}
          </div>

          {message && (
            <div className={clsx(
              "flex items-start gap-2 px-3 py-2 rounded-lg border text-xs",
              message.tone === "error" ? "bg-red-950/30 border-red-800/50 text-red-300"
                : message.tone === "ok" ? "bg-green-950/30 border-green-800/50 text-green-300"
                : "bg-slate-800/60 border-slate-700 text-slate-300"
            )}>
              <span className="flex-1 break-words">{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-200 shrink-0" aria-label="Dismiss">
                <X size={12} />
              </button>
            </div>
          )}

          {/* CR rows */}
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                    <input
                      value={r.key}
                      onChange={e => updateRow(r.id, { key: e.target.value })}
                      placeholder="EAINT-XXXX"
                      className="text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-blue-400 focus:outline-none focus:border-blue-600 placeholder-slate-600"
                    />
                    <input
                      value={r.title}
                      onChange={e => updateRow(r.id, { title: e.target.value })}
                      placeholder="Short title / description"
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-600 placeholder-slate-600"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveRow(r.id, -1)} disabled={i === 0}
                      className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveRow(r.id, 1)} disabled={i === rows.length - 1}
                      className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                    <button onClick={() => removeRow(r.id)}
                      className="p-1 text-slate-700 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Status lines */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-600 uppercase tracking-wider">Status notes <span className="normal-case text-slate-700">(one per line · indent 2 spaces for sub-bullet)</span></p>
                    <button
                      onClick={() => draftWithAI(r)}
                      disabled={draftingId === r.id || !r.key}
                      className={clsx(
                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-40",
                        draftingId === r.id
                          ? "border-purple-700/50 text-purple-400 bg-purple-900/20"
                          : "border-slate-700 text-slate-500 hover:border-purple-700/50 hover:text-purple-400 hover:bg-purple-900/10"
                      )}
                    >
                      {draftingId === r.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      {draftingId === r.id ? "Drafting…" : "Draft with AI"}
                    </button>
                  </div>
                  <textarea
                    value={r.statusLines}
                    onChange={e => updateRow(r.id, { statusLines: e.target.value })}
                    placeholder={"To continue testing...\n  CIBO testing - (57/57) 100% - Done\n  BoldPay - (9/13) 69.23% - PASS only"}
                    rows={3}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-600 placeholder-slate-600 resize-none"
                  />
                </div>

                {/* Progress */}
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Overall CR Testing Progress <span className="normal-case text-slate-700">(new line per sub-item e.g. eAuto / Secarang)</span></p>
                  <textarea
                    value={r.progress}
                    onChange={e => updateRow(r.id, { progress: e.target.value })}
                    rows={2}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>
            ))}

            <button onClick={addRow}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-600 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition-colors">
              <Plus size={13} />Add CR entry
            </button>
          </div>
        </div>

        {/* Right — preview (full screen on mobile when toggled, sidebar on desktop) */}
        <div className={clsx(
          "border-l border-slate-800 flex flex-col",
          "sm:w-80 sm:shrink-0",
          showPreview ? "flex-1" : "hidden sm:flex"
        )}>
          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-1">
            {(["preview", "history"] as const).map(t => (
              <button key={t} onClick={() => setSideTab(t)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors",
                  sideTab === t ? "bg-slate-800 text-slate-200 font-medium" : "text-slate-500 hover:text-slate-300"
                )}>
                {t === "history" && <History size={12} />}
                {t === "preview" ? "Preview" : `History (${history.length})`}
              </button>
            ))}
          </div>

          {sideTab === "preview" ? (
            <pre className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {preview || <span className="text-slate-600 italic">Add CR entries to see preview</span>}
            </pre>
          ) : viewing ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                <button onClick={() => { setViewingId(null); setConfirmDeleteId(null); }} className="p-1 text-slate-500 hover:text-slate-200 rounded" aria-label="Back to history">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-slate-300 flex-1 truncate">
                  {viewing.type === "todo" ? "To Do Plan" : "EOD Update"} · {viewing.date}
                </span>
                <button onClick={() => copyHistory(viewing)}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-500">
                  {copiedHistoryId === viewing.id ? <><Check size={11} className="text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy size={11} />Copy</>}
                </button>
                {confirmDeleteId === viewing.id ? (
                  <>
                    <button onClick={() => deleteHistory(viewing.id)} className="px-2 py-1 text-xs rounded-lg border border-red-800/60 text-red-300 hover:bg-red-950/40">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs rounded-lg border border-slate-700 text-slate-400">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId(viewing.id)} className="p-1 text-slate-600 hover:text-red-400" aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <pre className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">{viewing.text}</pre>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              {history.length === 0 ? (
                <p className="text-xs text-slate-600 italic px-1">No saved posts. Copy or Save a post to keep it here.</p>
              ) : history.map(h => (
                <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-colors">
                  <button onClick={() => { setViewingId(h.id); setConfirmDeleteId(null); }} className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-slate-200 font-medium">{h.type === "todo" ? "To Do Plan" : "EOD Update"} · {h.date}</p>
                    <p className="text-xs text-slate-500">
                      Saved {new Date(h.savedAt).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                  {confirmDeleteId === h.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => deleteHistory(h.id)} className="px-2 py-0.5 text-xs rounded border border-red-800/60 text-red-300 hover:bg-red-950/40">Delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 text-xs rounded border border-slate-700 text-slate-400">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => copyHistory(h)} className="p-1 text-slate-500 hover:text-slate-200 shrink-0" aria-label="Copy">
                        {copiedHistoryId === h.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                      <button onClick={() => setConfirmDeleteId(h.id)} className="p-1 text-slate-600 hover:text-red-400 shrink-0" aria-label="Delete">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
