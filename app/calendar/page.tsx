"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Rocket, CalendarDays,
  Clock, Loader2, Search, ExternalLink, Pencil, Trash2, Info, LayoutGrid, Table2, ClipboardPaste, Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import Linkified from "@/components/Linkified";
import {
  Deployment, DeploymentType, DeploymentStatus,
  DEPLOYMENT_TYPE_META, DEPLOYMENT_STATUS_META, DEPLOYMENT_ENVIRONMENTS,
  getDeployments, saveDeployments,
} from "@/lib/deployments";
import {
  CalendarEvent, EventColor,
  EVENT_COLOR_META, getCalendarEvents, saveCalendarEvents, dateInRange,
} from "@/lib/calendar-events";
import { getKanbanState, KanbanCard } from "@/lib/kanban";
import { getTodos, TodoItem } from "@/lib/todo";
import { todayLocal, daysFromToday, APP_TIMEZONE } from "@/lib/date";
import { parseDeploymentText, ParsedDeploymentItem } from "@/lib/deployment-parser";
import { getGeminiKey } from "@/components/SettingsModal";

// ── Helpers ───────────────────────────────────────────────
const _dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE });
function toDateStr(d: Date) {
  return _dateFmt.format(d);
}
function today() { return todayLocal(); }

function calendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0=Sun
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    days.push(d);
  }
  return days;
}

/** Returns the Monday of the week containing dateStr (YYYY-MM-DD). */
function weekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

/** Returns 7 date strings (Mon–Sun) starting from a Monday dateStr. */
function weekDays(mondayStr: string): string[] {
  const result: string[] = [];
  const base = new Date(mondayStr + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    result.push(toDateStr(d));
  }
  return result;
}

function fmtTime(t?: string, h24 = false) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (h24) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Unified event type for display ────────────────────────
type DayItem =
  | { kind: "deployment"; data: Deployment }
  | { kind: "event";      data: CalendarEvent }
  | { kind: "kanban";     data: KanbanCard }
  | { kind: "todo";       data: TodoItem };

function getChipClass(item: DayItem): string {
  if (item.kind === "deployment") return DEPLOYMENT_TYPE_META[item.data.type].chipBg;
  if (item.kind === "event")      return EVENT_COLOR_META[item.data.color].chipBg;
  if (item.kind === "kanban")     return "bg-blue-900/40 border-blue-800/50 text-blue-200";
  return "bg-slate-800 border-slate-700 text-slate-300";
}

function getItemLabel(item: DayItem): string {
  if (item.kind === "deployment") return `${item.data.ticketKey} ${item.data.ticketSummary}`.trim();
  if (item.kind === "event")      return item.data.title;
  if (item.kind === "kanban")     return item.data.title;
  return item.data.title;
}

function getItemTime(item: DayItem): string {
  if (item.kind === "deployment") return fmtTime(item.data.time);
  if (item.kind === "event" && !item.data.allDay) return fmtTime(item.data.startTime);
  return "";
}

// ── Add / Edit Deployment Modal ───────────────────────────
interface JiraTicket { key: string; summary: string; status: string; project: string; updated: string }

// Extracts plain text from Teams HTML clipboard, removing struck-through content.
function htmlToCleanText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("s, del, strike").forEach(el => el.remove());

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(node.childNodes).map(walk).join("");
    if (["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) return inner + "\n";
    if (tag === "br") return "\n";
    return inner;
  }

  return walk(doc.body).replace(/\n{3,}/g, "\n\n").trim();
}

// ── Paste Deployment Modal ────────────────────────────────────
function PasteDeploymentModal({ existing, onClose, onApply }: {
  existing: Deployment[];
  onClose: () => void;
  onApply: (items: ParsedDeploymentItem[]) => void;
}) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedDeploymentItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [struckRemoved, setStruckRemoved] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (!html) return;
    e.preventDefault();
    const tmp = new DOMParser().parseFromString(html, "text/html");
    const count = tmp.querySelectorAll("s, del, strike").length;
    setText(htmlToCleanText(html));
    setStruckRemoved(count);
  }

  function handleParse() {
    const items = parseDeploymentText(text, existing);
    setParsed(items);
    setSelected(new Set(items.map((_, i) => i)));
  }

  async function handleAIParse() {
    const key = getGeminiKey();
    if (!key) { setAiError("Add your Gemini API key in Settings first."); return; }
    setAiLoading(true);
    setAiError("");
    try {
      const todayStr = todayLocal();
      const existingSummary = existing.map(d => ({ id: d.id, date: d.date, type: d.type, summary: d.ticketSummary }));
      const prompt = `You are parsing a deployment schedule message from Microsoft Teams.

Today: ${todayStr}
Existing deployments: ${JSON.stringify(existingSummary)}

Extract ALL deployment entries from the text below. Return ONLY a valid JSON array, no explanation, no markdown.

Each item must have:
- "date": "YYYY-MM-DD" (use current year ${todayStr.slice(0, 4)} if year not mentioned)
- "summary": short description of what's being deployed (e.g. ticket name, fix name, or session label)
- "type": "night" if Night Session, otherwise "day"
- "status": "completed" if Completed/Done, "cancelled" if Postponed/Cancelled, otherwise "planned"
- "environment": "Production", "Staging", "UAT", or "Development" (default "Staging")
- "notes": any URLs or extra context (empty string if none)

Rules:
- Night session default time: 21:00. Day/Morning session default: 09:00
- If a message covers Morning AND Night on same date, create TWO items
- Strikethrough or "~~text~~" means cancelled/old — skip it
- If date+type matches an existing deployment, mark action "update", else "add"

Text:
${text}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      const data = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        promptFeedback?: { blockReason?: string };
        error?: { message?: string };
      };

      if (data.error?.message) throw new Error(`API error: ${data.error.message}`);
      if (data.promptFeedback?.blockReason) throw new Error(`Blocked by Gemini safety filter: ${data.promptFeedback.blockReason}`);

      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const raw = candidate?.content?.parts?.[0]?.text?.trim() ?? "";

      if (!raw) throw new Error(`Gemini returned no text (finishReason: ${finishReason ?? "unknown"}). Try simplifying the pasted message.`);

      // Extract the JSON array — find first [ and last ] to handle any surrounding text
      const start = raw.indexOf("[");
      const end   = raw.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error(`No JSON array found in response. Got: ${raw.slice(0, 200)}`);
      const jsonStr = raw.slice(start, end + 1);
      const aiItems = JSON.parse(jsonStr) as {
        date: string; summary: string; type: string; status: string; environment: string; notes: string;
      }[];

      const items: ParsedDeploymentItem[] = aiItems.map(item => {
        const type = item.type === "night" ? "night" : "day" as import("@/lib/deployments").DeploymentType;
        const status = (["planned","completed","cancelled"].includes(item.status) ? item.status : "planned") as import("@/lib/deployments").DeploymentStatus;
        const match = existing.find(e => e.date === item.date && e.type === type);
        return {
          action: match ? "update" : "add",
          matchId: match?.id,
          date: item.date,
          summary: item.summary || "",
          time: type === "night" ? "21:00" : "09:00",
          type,
          status,
          environment: item.environment || "Staging",
          notes: item.notes || "",
        };
      });

      items.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
      setParsed(items);
      setSelected(new Set(items.map((_, i) => i)));
    } catch (e) {
      setAiError(`AI parse failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAiLoading(false);
    }
  }

  function toggleItem(i: number) {
    setSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });
  }

  function handleApply() {
    if (!parsed) return;
    onApply(parsed.filter((_, i) => selected.has(i)));
    onClose();
  }

  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmtDate(d: string) {
    const [y, m, day] = d.split("-").map(Number);
    return `${day} ${MONTHS_SHORT[m - 1]} ${y}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardPaste size={15} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">Paste Deployment Update</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!parsed ? (
            <>
              <p className="text-xs text-slate-500">Paste a message from your senior (Teams, email, etc.) — strikethrough text is automatically removed, deployment dates and session types are detected.</p>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setStruckRemoved(0); }}
                onPaste={handlePaste}
                placeholder={"Paste the message here…\n\ne.g.:\n18th May Deployment\nXStar Chubb Fix\nstaging/uat1\nhttps://...\n\nor:\nPostponed!!! 18.05.2026 (Mon) - Night Session\nhttps://..."}
                className="w-full h-52 px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono leading-relaxed"
              />
              {struckRemoved > 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {struckRemoved} struck-through segment{struckRemoved !== 1 ? "s" : ""} removed from pasted text
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">
                  {parsed.length === 0 ? "No deployments detected" : `${parsed.length} deployment${parsed.length !== 1 ? "s" : ""} found`}
                </p>
                <button onClick={() => setParsed(null)} className="text-xs text-blue-400 hover:underline">← Re-paste</button>
              </div>

              {parsed.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-600 text-sm">
                  <ClipboardPaste size={28} className="mb-3 opacity-30" />
                  <p>No recognisable deployment dates found.</p>
                  <p className="text-xs mt-1 text-slate-700">Try re-pasting — supported formats: "18th May Deployment …" or "18.05.2026 (Mon) - Night Session"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parsed.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => toggleItem(i)}
                      className={clsx(
                        "flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors",
                        selected.has(i) ? "border-slate-700 bg-slate-800/70" : "border-slate-800 bg-transparent opacity-40"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleItem(i)}
                        onClick={e => e.stopPropagation()}
                        className="mt-0.5 shrink-0 accent-blue-500"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={clsx(
                            "text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                            item.action === "add"
                              ? "bg-green-900/50 text-green-300 border border-green-800/50"
                              : "bg-blue-900/50 text-blue-300 border border-blue-800/50"
                          )}>{item.action === "add" ? "NEW" : "UPDATE"}</span>
                          <span className="text-xs font-semibold text-slate-200">{fmtDate(item.date)}</span>
                          <span className={clsx("text-xs px-1.5 py-0.5 rounded font-medium",
                            item.type === "night" ? "bg-purple-950/60 text-purple-300" : "bg-sky-950/60 text-sky-300"
                          )}>{item.type === "night" ? "Night" : "Day"}</span>
                          <span className={clsx("text-xs px-1.5 py-0.5 rounded font-medium",
                            item.status === "completed" ? "bg-green-950/50 text-green-300" :
                            item.status === "cancelled" ? "bg-slate-800 text-slate-500" :
                            "bg-blue-950/40 text-blue-300"
                          )}>{item.status}</span>
                          <span className="text-xs text-slate-500">{item.environment}</span>
                        </div>
                        <p className="text-xs text-slate-300 truncate">{item.summary}</p>
                        {item.notes && <p className="text-xs text-slate-600 truncate">{item.notes.split("\n")[0]}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-5 py-4 shrink-0 space-y-2">
          {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          {!parsed ? (
            <div className="flex gap-2">
              <button
                onClick={handleParse}
                disabled={!text.trim()}
                className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Parse Message
              </button>
              <button
                onClick={handleAIParse}
                disabled={!text.trim() || aiLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 border border-purple-700/50 text-purple-300 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {aiLoading ? "Parsing…" : "Parse with AI"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={selected.size === 0 || parsed.length === 0}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply {selected.size} item{selected.size !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeploymentModal({ initial, onClose, onSave, creds }: {
  initial?: Deployment;
  onClose: () => void;
  onSave: (d: Deployment) => void;
  creds: ReturnType<typeof useApp>["creds"];
}) {
  const [step, setStep] = useState<"ticket" | "form">(initial ? "form" : "ticket");
  const [ticketKey, setTicketKey]       = useState(initial?.ticketKey ?? "");
  const [ticketSummary, setTicketSummary] = useState(initial?.ticketSummary ?? "");
  const [date, setDate]                 = useState(initial?.date ?? today());
  const [time, setTime]                 = useState(initial?.time ?? "22:00");
  const [type, setType]                 = useState<DeploymentType>(initial?.type ?? "night");
  const [environment, setEnvironment]   = useState(initial?.environment ?? "Production");
  const [deployedBy, setDeployedBy]     = useState(initial?.deployedBy ?? "");
  const [rollbackPlan, setRollbackPlan] = useState(initial?.rollbackPlan ?? "");
  const [notes, setNotes]               = useState(initial?.notes ?? "");
  const [status, setStatus]             = useState<DeploymentStatus>(initial?.status ?? "planned");

  // Kanban board Jira-linked cards (loaded once)
  const [kanbanJiraCards] = useState<JiraTicket[]>(() => {
    const state = getKanbanState();
    const seen = new Set<string>();
    const cards: JiraTicket[] = [];
    for (const col of ["urgent","todo","ongoing","on-hold","finished"] as const) {
      for (const c of state[col]) {
        if (c.jiraKey && !seen.has(c.jiraKey)) {
          seen.add(c.jiraKey);
          cards.push({ key: c.jiraKey, summary: c.title, status: c.jiraStatus ?? "", project: c.jiraProject ?? "", updated: c.createdAt });
        }
      }
    }
    return cards;
  });

  // Jira search
  const [jiraTickets, setJiraTickets]   = useState<JiraTicket[]>([]);
  const [jiraLoading, setJiraLoading]   = useState(false);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);
  const [jiraError, setJiraError]       = useState("");
  const [jiraQuery, setJiraQuery]       = useState("");
  const [manualKey, setManualKey]       = useState("");

  // Initial load: recent assigned/reported tickets
  useEffect(() => {
    if (step !== "ticket" || !creds) return;
    setJiraLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql: "(assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC",
        maxResults: 100,
        fields: ["summary", "status", "project", "updated"],
      }),
    })
      .then(r => r.json())
      .then(data => {
        setJiraTickets((data.issues ?? []).map((i: { key: string; fields: { summary: string; status: { name: string }; project: { name: string }; updated: string } }) => ({
          key: i.key,
          summary: i.fields.summary,
          status: i.fields.status.name,
          project: i.fields.project.name,
          updated: i.fields.updated,
        })));
      })
      .catch(() => setJiraError("Failed to load tickets"))
      .finally(() => setJiraLoading(false));
  }, [step, creds]);

  // Debounced full-text search across all accessible tickets
  useEffect(() => {
    if (step !== "ticket" || !creds || jiraQuery.length < 2) return;
    const escaped = jiraQuery.trim().replace(/"/g, "");
    const isId  = /^\d+$/.test(escaped);
    const isKey = /^[A-Za-z]+-\d+$/.test(escaped);
    const resolvedKey = isId && creds?.defaultProjectKey ? `${creds.defaultProjectKey}-${escaped}` : null;
    const jql = resolvedKey ? `key = "${resolvedKey}" ORDER BY updated DESC`
              : isId        ? `id = ${escaped} ORDER BY updated DESC`
              : isKey       ? `key = "${escaped}" ORDER BY updated DESC`
              : `text ~ "${escaped}" ORDER BY updated DESC`;
    const timer = setTimeout(() => {
      setJiraSearchLoading(true);
      fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql,
          maxResults: 50,
          fields: ["summary", "status", "project", "updated"],
        }),
      })
        .then(r => r.json())
        .then(data => {
          setJiraTickets((data.issues ?? []).map((i: { key: string; fields: { summary: string; status: { name: string }; project: { name: string }; updated: string } }) => ({
            key: i.key,
            summary: i.fields.summary,
            status: i.fields.status.name,
            project: i.fields.project.name,
            updated: i.fields.updated,
          })));
        })
        .catch(() => {})
        .finally(() => setJiraSearchLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [jiraQuery, step, creds]);

  const filteredKanban = kanbanJiraCards.filter(t => {
    const q = jiraQuery.toLowerCase();
    return !q || t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.project.toLowerCase().includes(q);
  });

  const filteredTickets = jiraTickets.filter(t => {
    const q = jiraQuery.toLowerCase();
    const notInKanban = !kanbanJiraCards.some(k => k.key === t.key);
    return notInKanban && (!q || t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.project.toLowerCase().includes(q));
  });

  function selectTicket(t: JiraTicket) {
    setTicketKey(t.key);
    setTicketSummary(t.summary);
    setStep("form");
  }

  function handleManualNext() {
    setTicketKey(manualKey.trim().toUpperCase());
    setStep("form");
  }

  function handleSave() {
    if (!ticketKey.trim() || !date || !time) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      ticketKey: ticketKey.trim(),
      ticketSummary,
      date, time, type, environment, deployedBy, rollbackPlan, notes, status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  const tm = DEPLOYMENT_TYPE_META[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Rocket size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              {initial ? "Edit Deployment" : step === "ticket" ? "Select Ticket" : "New Deployment"}
            </h2>
            {step === "form" && ticketKey && (
              <span className="text-xs font-mono text-blue-400 font-bold">{ticketKey}</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── Step 1: Ticket selection ── */}
          {step === "ticket" && (
            <>
              {creds ? (
                <>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      value={jiraQuery}
                      onChange={e => setJiraQuery(e.target.value)}
                      placeholder="Search all tickets by key, summary, or project…"
                      className={inp + " pl-8 pr-8"}
                      autoFocus
                    />
                    {jiraSearchLoading && <Loader2 size={13} className="absolute right-3 top-2.5 text-blue-400 animate-spin" />}
                  </div>
                  {jiraLoading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-blue-400" /></div>}
                  {jiraError && <p className="text-sm text-red-400">{jiraError}</p>}

                  {/* Kanban board section */}
                  {filteredKanban.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1.5">From Kanban Board</p>
                      <div className="space-y-1.5">
                        {filteredKanban.map(t => (
                          <button key={t.key} onClick={() => selectTicket(t)}
                            className="w-full text-left bg-blue-950/30 border border-blue-800/50 rounded-xl p-3 hover:border-blue-500 transition-colors">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono text-blue-400 font-bold">{t.key}</span>
                              {t.status && <span className="text-xs bg-slate-700 text-slate-400 px-1.5 rounded">{t.status}</span>}
                              {t.project && <span className="text-xs text-slate-600 ml-auto">{t.project}</span>}
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-1">{t.summary}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jira search results */}
                  {!jiraLoading && filteredTickets.length > 0 && (
                    <div>
                      {filteredKanban.length > 0 && <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1.5">From Jira</p>}
                      <div className="space-y-1.5">
                        {filteredTickets.map(t => (
                          <button key={t.key} onClick={() => selectTicket(t)}
                            className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-blue-500 transition-colors">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono text-blue-400 font-bold">{t.key}</span>
                              <span className="text-xs bg-slate-700 text-slate-400 px-1.5 rounded">{t.status}</span>
                              <span className="text-xs text-slate-600 ml-auto">{new Date(t.updated).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-1">{t.summary}</p>
                            <p className="text-xs text-slate-600">{t.project}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!jiraLoading && filteredKanban.length === 0 && filteredTickets.length === 0 && !jiraError && (
                    <p className="text-xs text-slate-600 text-center py-4">{jiraQuery ? "No tickets match — try a different search" : "No tickets found"}</p>
                  )}
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-600 mb-2">Or enter ticket key manually:</p>
                    <div className="flex gap-2">
                      <input value={manualKey} onChange={e => setManualKey(e.target.value)}
                        placeholder="e.g. PROJ-123" className={inp + " flex-1"} />
                      <button onClick={handleManualNext} disabled={!manualKey.trim()}
                        className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-40">
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 text-center py-2">
                    Jira not connected — enter the ticket key manually.
                  </p>
                  <div className="flex gap-2">
                    <input value={manualKey} onChange={e => setManualKey(e.target.value)}
                      placeholder="e.g. PROJ-123 or 10052" className={inp + " flex-1"} />
                    <button onClick={handleManualNext} disabled={!manualKey.trim()}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-40">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Deployment form ── */}
          {step === "form" && (
            <>
              {/* Ticket summary */}
              <div>
                <label className={lbl}>Ticket Summary</label>
                <input value={ticketSummary} onChange={e => setTicketSummary(e.target.value)}
                  placeholder="Brief description of what's being deployed"
                  className={inp} />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Deployment Date <span className="text-red-500">*</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className={inp + " [color-scheme:dark]"} />
                </div>
                <div>
                  <label className={lbl}>Deployment Time <span className="text-red-500">*</span></label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className={inp + " [color-scheme:dark]"} />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className={lbl}>Deployment Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {(["day", "night"] as DeploymentType[]).map(t => {
                    const m = DEPLOYMENT_TYPE_META[t];
                    return (
                      <button key={t} onClick={() => setType(t)}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          type === t ? `${m.bg} ${m.border} ${m.text}` : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                        )}>
                        <span className={clsx("w-2.5 h-2.5 rounded-full shrink-0", m.dot)} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Environment + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Environment</label>
                  <select value={environment} onChange={e => setEnvironment(e.target.value)} className={sel}>
                    {DEPLOYMENT_ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as DeploymentStatus)} className={sel}>
                    {Object.entries(DEPLOYMENT_STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deployed By */}
              <div>
                <label className={lbl}>Deployed By</label>
                <input value={deployedBy} onChange={e => setDeployedBy(e.target.value)}
                  placeholder="Name of person handling the deployment"
                  className={inp} />
              </div>

              {/* Rollback Plan */}
              <div>
                <label className={lbl}>Rollback Plan</label>
                <textarea value={rollbackPlan} onChange={e => setRollbackPlan(e.target.value)}
                  rows={2} placeholder="Steps to revert if deployment fails…"
                  className={inp + " resize-none"} />
              </div>

              {/* Notes */}
              <div>
                <label className={lbl}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Any additional context, dependencies, or warnings…"
                  className={inp + " resize-none"} />
              </div>

              {!initial && (
                <button onClick={() => setStep("ticket")} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  ← Change ticket
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-5 py-4 border-t border-slate-800 shrink-0">
            <button onClick={handleSave} disabled={!ticketKey.trim() || !date || !time}
              className={clsx(
                "w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40",
                type === "night"
                  ? "bg-purple-700 hover:bg-purple-600 text-white"
                  : "bg-sky-700 hover:bg-sky-600 text-white"
              )}>
              {initial ? "Save Changes" : `Schedule ${DEPLOYMENT_TYPE_META[type].label}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add / Edit Custom Event Modal ─────────────────────────
function EventModal({ initial, defaultDate, onClose, onSave }: {
  initial?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
  onSave: (e: CalendarEvent) => void;
}) {
  const [title, setTitle]         = useState(initial?.title ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaultDate ?? today());
  const [endDate, setEndDate]     = useState(initial?.endDate ?? defaultDate ?? today());
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime]     = useState(initial?.endTime ?? "");
  const [allDay, setAllDay]       = useState(initial?.allDay ?? true);
  const [color, setColor]         = useState<EventColor>(initial?.color ?? "blue");
  const [notes, setNotes]         = useState(initial?.notes ?? "");

  function handleSave() {
    if (!title.trim() || !startDate || !endDate) return;
    const effectiveEnd = endDate < startDate ? startDate : endDate;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      startDate,
      endDate: effectiveEnd,
      startTime: allDay ? undefined : (startTime || undefined),
      endTime:   allDay ? undefined : (endTime || undefined),
      color, notes, allDay,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">{initial ? "Edit Event" : "New Event"}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className={lbl}>Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Event name" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className={inp + " [color-scheme:dark]"} />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                min={startDate} className={inp + " [color-scheme:dark]"} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setAllDay(v => !v)}
              className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                allDay ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-500")}>
              <div className={clsx("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                allDay ? "border-blue-400 bg-blue-400" : "border-slate-600")}>
                {allDay && <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
              </div>
              All day
            </button>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className={inp + " [color-scheme:dark]"} />
              </div>
              <div>
                <label className={lbl}>End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className={inp + " [color-scheme:dark]"} />
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(EVENT_COLOR_META) as EventColor[]).map(c => (
                <button key={c} onClick={() => setColor(c)} title={EVENT_COLOR_META[c].label}
                  className={clsx("w-7 h-7 rounded-full transition-all", EVENT_COLOR_META[c].dot,
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-60 hover:opacity-100")} />
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Any details…" className={inp + " resize-none"} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-800 shrink-0">
          <button onClick={handleSave} disabled={!title.trim() || !startDate}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
            {initial ? "Save Changes" : "Add Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day Detail Popover ────────────────────────────────────
function DayDetail({ date, items, onClose, onEditDeployment, onDeleteDeployment, onEditEvent, onDeleteEvent, fmt }: {
  date: string;
  items: DayItem[];
  onClose: () => void;
  onEditDeployment: (d: Deployment) => void;
  onDeleteDeployment: (id: string) => void;
  onEditEvent: (e: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  fmt: (t?: string) => string;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [d, m, y] = [new Date(date + "T12:00:00").getDate(), new Date(date + "T12:00:00").getMonth(), new Date(date + "T12:00:00").getFullYear()];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div>
            <p className="text-sm font-semibold text-slate-200">{MONTHS[m]} {d}, {y}</p>
            <p className="text-xs text-slate-500">{items.length} event{items.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-300"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 && <p className="text-xs text-slate-600 text-center py-6">No events on this day</p>}
          {items.map((item, i) => {
            if (item.kind === "deployment") {
              const d = item.data;
              const tm = DEPLOYMENT_TYPE_META[d.type];
              const sm = DEPLOYMENT_STATUS_META[d.status];
              return (
                <div key={i} className={clsx("rounded-xl border p-3", tm.bg, tm.border)}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-bold text-blue-400">{d.ticketKey}</span>
                        <span className={clsx("text-xs font-medium", tm.text)}>{tm.label}</span>
                        <span className={clsx("text-xs font-medium ml-auto", sm.color)}>{sm.label}</span>
                      </div>
                      <p className={clsx("text-sm font-medium leading-snug", tm.text)}>{d.ticketSummary || d.ticketKey}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => onEditDeployment(d)} aria-label="Edit deployment" className="p-1 text-slate-600 hover:text-slate-300"><Pencil size={12} /></button>
                      {confirmDeleteId === d.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { onDeleteDeployment(d.id); setConfirmDeleteId(null); }} className="px-1.5 py-0.5 text-xs bg-red-700 text-white rounded hover:bg-red-600">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-1.5 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(d.id)} aria-label="Delete deployment" className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} />{fmt(d.time)}</span>
                    {d.environment && <span>{d.environment}</span>}
                    {d.deployedBy  && <span>by {d.deployedBy}</span>}
                  </div>
                  {d.notes && <Linkified text={d.notes} className="text-xs text-slate-500 mt-1.5 line-clamp-2" />}
                  {d.rollbackPlan && (
                    <p className="text-xs text-slate-600 mt-1"><span className="text-slate-500 font-medium">Rollback:</span> {d.rollbackPlan}</p>
                  )}
                </div>
              );
            }

            if (item.kind === "event") {
              const e = item.data;
              const cm = EVENT_COLOR_META[e.color];
              const isMultiDay = e.startDate !== e.endDate;
              return (
                <div key={i} className={clsx("rounded-xl border p-3", cm.chipBg)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{e.title}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs opacity-70 mt-0.5">
                        {!e.allDay && e.startTime && <span className="flex items-center gap-1"><Clock size={10} />{fmt(e.startTime)}{e.endTime && ` – ${fmt(e.endTime)}`}</span>}
                        {e.allDay && <span>All day</span>}
                        {isMultiDay && <span>{e.startDate} → {e.endDate}</span>}
                      </div>
                      {e.notes && <Linkified text={e.notes} className="text-xs opacity-60 mt-1 line-clamp-2" />}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => onEditEvent(e)} aria-label="Edit event" className="p-1 text-slate-600 hover:text-slate-300"><Pencil size={12} /></button>
                      {confirmDeleteId === e.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { onDeleteEvent(e.id); setConfirmDeleteId(null); }} className="px-1.5 py-0.5 text-xs bg-red-700 text-white rounded hover:bg-red-600">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-1.5 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(e.id)} aria-label="Delete event" className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.kind === "kanban") {
              const c = item.data;
              return (
                <div key={i} className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-3">
                  <p className="text-xs text-blue-400 font-semibold mb-0.5">Kanban Due</p>
                  {c.jiraKey && <span className="text-xs font-mono text-blue-400 mr-2">{c.jiraKey}</span>}
                  <p className="text-sm text-slate-200">{c.title}</p>
                </div>
              );
            }

            // todo
            const t = item.data;
            return (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold mb-0.5">Task Due</p>
                <p className="text-sm text-slate-200">{t.title}</p>
                {t.jiraKey && <span className="text-xs font-mono text-blue-400">{t.jiraKey}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Calendar Page ─────────────────────────────────────────
export default function CalendarPage() {
  const { creds } = useApp();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [deployments, setDeployments]       = useState<Deployment[]>([]);
  const [calEvents, setCalEvents]           = useState<CalendarEvent[]>([]);
  const [kanbanCards, setKanbanCards]       = useState<KanbanCard[]>([]);
  const [todos, setTodos]                   = useState<TodoItem[]>([]);

  const [use24h, setUse24h] = useState(false);
  const fmt = (t?: string) => fmtTime(t, use24h);

  // View mode: month or week
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [weekMon, setWeekMon] = useState(() => weekStart(todayLocal()));

  const [showDeployModal, setShowDeployModal]   = useState(false);
  const [showEventModal, setShowEventModal]     = useState(false);
  const [showPasteModal, setShowPasteModal]     = useState(false);
  const [editDeployment, setEditDeployment]     = useState<Deployment | undefined>();
  const [editEvent, setEditEvent]               = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate]         = useState<string | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<string | undefined>();

  useEffect(() => {
    setDeployments(getDeployments());
    setCalEvents(getCalendarEvents());
    const ks = getKanbanState();
    setKanbanCards(["urgent","todo","ongoing","on-hold","finished"].flatMap(c => ks[c as keyof typeof ks] as KanbanCard[]));
    setTodos(getTodos());
    setUse24h(localStorage.getItem("calendar_24h") === "true");
  }, []);

  function saveAndSetDeployments(items: Deployment[]) { setDeployments(items); saveDeployments(items); }
  function saveAndSetEvents(items: CalendarEvent[]) { setCalEvents(items); saveCalendarEvents(items); }

  function handleSaveDeployment(d: Deployment) {
    saveAndSetDeployments(
      editDeployment
        ? deployments.map(x => x.id === d.id ? d : x)
        : [...deployments, d]
    );
    setShowDeployModal(false);
    setEditDeployment(undefined);
  }

  function handlePasteApply(items: ParsedDeploymentItem[]) {
    let updated = [...deployments];
    for (const item of items) {
      if (item.action === "update" && item.matchId) {
        updated = updated.map(d => d.id === item.matchId ? {
          ...d,
          ticketSummary: item.summary || d.ticketSummary,
          date: item.date,
          time: item.time,
          type: item.type,
          status: item.status,
          environment: item.environment || d.environment,
          notes: item.notes || d.notes,
        } : d);
      } else {
        updated.push({
          id: crypto.randomUUID(),
          ticketKey: "",
          ticketSummary: item.summary,
          date: item.date,
          time: item.time,
          type: item.type,
          environment: item.environment,
          deployedBy: "",
          rollbackPlan: "",
          notes: item.notes,
          status: item.status,
          createdAt: new Date().toISOString(),
        });
      }
    }
    saveAndSetDeployments(updated);
  }

  function handleSaveEvent(e: CalendarEvent) {
    saveAndSetEvents(
      editEvent
        ? calEvents.map(x => x.id === e.id ? e : x)
        : [...calEvents, e]
    );
    setShowEventModal(false);
    setEditEvent(undefined);
  }

  // Build day → items map
  const days = useMemo(() => calendarDays(year, month), [year, month]);

  const dayItemsMap = useMemo(() => {
    const map = new Map<string, DayItem[]>();

    function getOrCreate(key: string): DayItem[] {
      if (!map.has(key)) map.set(key, []);
      return map.get(key)!;
    }

    for (const d of deployments) {
      getOrCreate(d.date).push({ kind: "deployment", data: d });
    }
    for (const e of calEvents) {
      // span multi-day events across all days in range
      const start = new Date(e.startDate + "T12:00:00");
      const end   = new Date(e.endDate   + "T12:00:00");
      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        getOrCreate(toDateStr(cur)).push({ kind: "event", data: e });
      }
    }
    for (const c of kanbanCards) {
      if (c.dueDate) getOrCreate(c.dueDate).push({ kind: "kanban", data: c });
    }
    for (const t of todos) {
      if (!t.done && t.dueDate) getOrCreate(t.dueDate).push({ kind: "todo", data: t });
    }

    // Sort each day's items: deployments first by time, then events, kanban, todo
    const order = { deployment: 0, event: 1, kanban: 2, todo: 3 };
    for (const items of map.values()) {
      items.sort((a, b) => {
        if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
        const ta = a.kind === "deployment" ? a.data.time : (a.kind === "event" ? (a.data.startTime ?? "") : "");
        const tb = b.kind === "deployment" ? b.data.time : (b.kind === "event" ? (b.data.startTime ?? "") : "");
        return ta.localeCompare(tb);
      });
    }
    return map;
  }, [deployments, calEvents, kanbanCards, todos]);

  const todayStr = today();
  const selectedItems = selectedDate ? (dayItemsMap.get(selectedDate) ?? []) : [];

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }

  function prevWeek() {
    const d = new Date(weekMon + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setWeekMon(toDateStr(d));
  }
  function nextWeek() {
    const d = new Date(weekMon + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setWeekMon(toDateStr(d));
  }

  const currentWeekDays = weekDays(weekMon);
  const weekSun = currentWeekDays[6];
  // Label for week header e.g. "20 – 26 May 2026" or "28 Apr – 4 May 2026"
  const weekLabel = (() => {
    const s = new Date(weekMon + "T12:00:00");
    const e = new Date(weekSun + "T12:00:00");
    const sameMonth = s.getMonth() === e.getMonth();
    if (sameMonth) {
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    }
    const sameYear = s.getFullYear() === e.getFullYear();
    return `${s.getDate()} ${MONTHS[s.getMonth()]}${sameYear ? "" : " " + s.getFullYear()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  })();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays size={15} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Calendar</h1>

          {/* Month / Week toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button onClick={() => setCalView("month")}
              className={clsx("flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                calView === "month" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
              <Table2 size={11} /> Month
            </button>
            <button onClick={() => setCalView("week")}
              className={clsx("flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                calView === "week" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
              <LayoutGrid size={11} /> Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button onClick={calView === "month" ? prevMonth : prevWeek} aria-label="Previous" className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-l-lg transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-sm font-semibold text-slate-200 min-w-[170px] text-center">
              {calView === "month" ? `${MONTHS[month]} ${year}` : weekLabel}
            </span>
            <button onClick={calView === "month" ? nextMonth : nextWeek} aria-label="Next" className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-r-lg transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={() => {
              setYear(now.getFullYear()); setMonth(now.getMonth());
              setWeekMon(weekStart(todayLocal()));
            }}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors">
            Today
          </button>
          <button
            onClick={() => { const next = !use24h; setUse24h(next); localStorage.setItem("calendar_24h", String(next)); }}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors border border-slate-800"
            title="Toggle time format"
          >
            {use24h ? "24h" : "12h"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditEvent(undefined); setDefaultModalDate(undefined); setShowEventModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 hover:bg-slate-700 transition-colors"
          >
            <Plus size={13} /> Add Event
          </button>
          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-300 bg-purple-900/30 border border-purple-800/60 rounded-lg hover:bg-purple-900/50 transition-colors"
          >
            <ClipboardPaste size={13} /> Paste Update
          </button>
          <button
            onClick={() => { setEditDeployment(undefined); setShowDeployModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
            style={{ background: "linear-gradient(135deg, #4c1d95, #1e3a5f)" }}
          >
            <Rocket size={13} /> + Add Deployment
          </button>
        </div>
      </header>

      <div className="flex-1 px-2 py-3 sm:px-6 sm:py-5">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" />Day Deployment</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />Night Deployment</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Custom Event</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Kanban Due</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" />Task Due</span>
        </div>

        {/* ── Week view ── */}
        {calView === "week" && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day column headers */}
              <div className="grid grid-cols-7 gap-px mb-px">
                {currentWeekDays.map(dateStr => {
                  const d = new Date(dateStr + "T12:00:00");
                  const isToday = dateStr === todayStr;
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum  = d.getDate();
                  const monthAbbr = d.toLocaleDateString("en-US", { month: "short" });
                  return (
                    <div key={dateStr} className="text-center py-2">
                      <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">{dayName}</p>
                      <span className={clsx(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-0.5",
                        isToday ? "bg-blue-600 text-white" : "text-slate-300"
                      )}>{dayNum}</span>
                      <p className="text-xs text-slate-600 mt-0.5">{monthAbbr}</p>
                    </div>
                  );
                })}
              </div>

              {/* Day columns */}
              <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-2xl overflow-hidden border border-slate-800">
                {currentWeekDays.map(dateStr => {
                  const items = dayItemsMap.get(dateStr) ?? [];
                  const isToday = dateStr === todayStr;
                  return (
                    <div
                      key={dateStr}
                      onClick={() => { setSelectedDate(dateStr); setDefaultModalDate(dateStr); }}
                      className={clsx(
                        "min-h-[220px] p-2 cursor-pointer transition-colors",
                        isToday ? "bg-blue-950/20" : "bg-slate-950 hover:bg-slate-900/60"
                      )}
                    >
                      {items.length === 0 && (
                        <p className="text-xs text-slate-800 text-center mt-6">—</p>
                      )}
                      <div className="space-y-1">
                        {items.map((item, i) => {
                          const chipClass = getChipClass(item);
                          const label = getItemLabel(item);
                          const time = getItemTime(item);
                          return (
                            <div key={i} className={clsx("text-xs rounded-lg px-1.5 py-1 border leading-snug", chipClass)}>
                              {time && <p className="font-semibold opacity-80 mb-0.5">{time}</p>}
                              <p className="break-words">{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Month view ── */}
        {calView === "month" && <>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-xs font-semibold text-slate-600 text-center py-1 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-2xl overflow-hidden border border-slate-800">
          {days.map((day, idx) => {
            const dateStr = toDateStr(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = dateStr === todayStr;
            const items = (dayItemsMap.get(dateStr) ?? []);
            const visible = items.slice(0, 3);
            const overflow = items.length - 3;

            return (
              <div
                key={idx}
                onClick={() => { setSelectedDate(dateStr); }}
                className={clsx(
                  "min-h-[100px] p-2 cursor-pointer transition-colors",
                  isCurrentMonth ? "bg-slate-950 hover:bg-slate-900" : "bg-slate-950/60 hover:bg-slate-900/60",
                  selectedDate === dateStr && "bg-slate-900"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={clsx(
                    "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-slate-300" : "text-slate-700"
                  )}>
                    {day.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[9px] text-slate-700">{items.length}</span>
                  )}
                </div>

                {/* Event chips */}
                <div className="space-y-0.5">
                  {visible.map((item, i) => {
                    const chipClass = getChipClass(item);
                    const label = getItemLabel(item);
                    const time = getItemTime(item);
                    return (
                      <div key={i} className={clsx("text-xs rounded px-1 py-0.5 border truncate leading-tight flex items-center gap-1", chipClass)}>
                        {time && <span className="shrink-0 opacity-70">{time}</span>}
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <div className="text-xs text-slate-600 pl-1">+{overflow} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>}

        {/* Upcoming deployments list below calendar */}
        {deployments.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">Upcoming Deployments</p>
            <div className="space-y-2">
              {deployments
                .filter(d => d.date >= todayStr && d.status !== "cancelled")
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .slice(0, 8)
                .map(d => {
                  const tm = DEPLOYMENT_TYPE_META[d.type];
                  const sm = DEPLOYMENT_STATUS_META[d.status];
                  return (
                    <div key={d.id} className={clsx("flex items-center gap-3 rounded-xl border px-4 py-3", tm.bg, tm.border)}>
                      <span className={clsx("w-2 h-2 rounded-full shrink-0", tm.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-400">{d.ticketKey}</span>
                          <span className={clsx("text-xs font-medium", tm.text)}>{tm.label}</span>
                          <span className={clsx("text-xs", sm.color)}>{sm.label}</span>
                        </div>
                        <p className={clsx("text-sm font-medium truncate", tm.text)}>{d.ticketSummary || d.ticketKey}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        <p className={clsx("text-xs", tm.text)}>{fmt(d.time)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditDeployment(d); setShowDeployModal(true); }} className="p-1.5 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800"><Pencil size={12} /></button>
                        <button onClick={() => saveAndSetDeployments(deployments.filter(x => x.id !== d.id))} className="p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-800"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPasteModal && (
        <PasteDeploymentModal
          existing={deployments}
          onClose={() => setShowPasteModal(false)}
          onApply={handlePasteApply}
        />
      )}

      {showDeployModal && (
        <DeploymentModal
          initial={editDeployment}
          creds={creds}
          onClose={() => { setShowDeployModal(false); setEditDeployment(undefined); }}
          onSave={handleSaveDeployment}
        />
      )}

      {showEventModal && (
        <EventModal
          initial={editEvent}
          defaultDate={defaultModalDate}
          onClose={() => { setShowEventModal(false); setEditEvent(undefined); }}
          onSave={handleSaveEvent}
        />
      )}

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          items={selectedItems}
          onClose={() => setSelectedDate(null)}
          onEditDeployment={d => { setEditDeployment(d); setShowDeployModal(true); setSelectedDate(null); }}
          onDeleteDeployment={id => saveAndSetDeployments(deployments.filter(x => x.id !== id))}
          onEditEvent={e => { setEditEvent(e); setShowEventModal(true); setSelectedDate(null); }}
          onDeleteEvent={id => saveAndSetEvents(calEvents.filter(x => x.id !== id))}
          fmt={fmt}
        />
      )}
    </div>
  );
}

const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
