"use client";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Plus, X, ChevronUp, ChevronDown, Sparkles, Loader2, SidebarOpen } from "lucide-react";
import { useApp } from "@/components/AppShell";
import { getGeminiKey } from "@/components/SettingsModal";
import { getKanbanState, KanbanCard } from "@/lib/kanban";
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

  const name = creds?.email ? firstNameFromEmail(creds.email) : "Faizuddin";

  useEffect(() => {
    const cards  = getKanbanState().ongoing as KanbanCard[];
    const tsData = loadTSData();
    setRows(buildRows(cards, tsData));
  }, []);

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
    if (!key) { alert("Add your Gemini API key in Settings first."); return; }
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
    } catch (e) {
      alert(`Gemini error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDraftingId(null);
    }
  }, [type, updateRow]);

  const timeStr = formatTime(hour, min);
  const preview = generateText(name, type, date, timeStr, rows);

  function copy() {
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
            onClick={copy}
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
          </div>

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
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs font-medium text-slate-400">Preview</p>
          </div>
          <pre className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {preview || <span className="text-slate-600 italic">Add CR entries to see preview</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}
