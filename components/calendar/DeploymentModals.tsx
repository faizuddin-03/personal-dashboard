"use client";
// Deployment create/edit modal and the paste-a-message (rule-based or AI)
// deployment importer. Moved out of app/calendar/page.tsx on 2026-10-21;
// behaviour kept, plus release/fix version and ticket list fields.

import { useState, useEffect } from "react";
import { X, Rocket, Loader2, Search, ClipboardPaste, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { useApp } from "@/components/AppShell";
import {
  Deployment, DeploymentType, DeploymentStatus,
  DEPLOYMENT_TYPE_META, DEPLOYMENT_STATUS_META, DEPLOYMENT_ENVIRONMENTS,
} from "@/lib/deployments";
import { getKanbanState } from "@/lib/kanban";
import { todayLocal } from "@/lib/date";
import { parseDeploymentText, ParsedDeploymentItem } from "@/lib/deployment-parser";
import { getActiveAi } from "@/lib/aiSettings";
import { inp, lbl, sel } from "./ui";
import { useColorScheme } from "./store";

function today() { return todayLocal(); }

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
export function PasteDeploymentModal({ existing, onClose, onApply }: {
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
    const ai = getActiveAi();
    if (!ai) { setAiError("No AI provider configured. Go to Settings → AI Settings, pick a provider and save its API key."); return; }
    setAiLoading(true);
    setAiError("");
    try {
      const existingSummary = existing.map(d => ({ id: d.id, date: d.date, type: d.type, summary: d.ticketSummary }));

      const res = await fetch("/api/calendar/parse-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          todayStr: todayLocal(),
          existing: existingSummary,
          ai,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Parse failed (${res.status})`);

      const aiItems = data.deployments as {
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
    setSelected(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
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
                  <p className="text-xs mt-1 text-slate-700">Try re-pasting — supported formats: &quot;18th May Deployment …&quot; or &quot;18.05.2026 (Mon) - Night Session&quot;</p>
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

export function DeploymentModal({ initial, onClose, onSave, creds }: {
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
  const [fixVersion, setFixVersion]     = useState(initial?.fixVersion ?? "");
  const [ticketsText, setTicketsText]   = useState((initial?.tickets ?? []).join(", "));
  const scheme = useColorScheme();

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
  const [jiraLoading, setJiraLoading]   = useState(() => !initial && !!creds);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);
  const [jiraError, setJiraError]       = useState("");
  const [jiraQuery, setJiraQuery]       = useState("");
  const [manualKey, setManualKey]       = useState("");

  // Initial load: recent assigned/reported tickets
  useEffect(() => {
    if (step !== "ticket" || !creds) return;
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

  const canSave = !!(ticketKey.trim() || ticketSummary.trim()) && !!date && !!time;

  function handleSave() {
    if (!canSave) return;
    const tickets = Array.from(new Set(
      ticketsText.split(/[\s,;]+/).map(t => t.trim().toUpperCase()).filter(Boolean),
    ));
    onSave({
      ...(initial ?? {}),
      id: initial?.id ?? crypto.randomUUID(),
      ticketKey: ticketKey.trim().toUpperCase(),
      ticketSummary,
      date, time, type, environment, deployedBy, rollbackPlan, notes, status,
      fixVersion: fixVersion.trim() || undefined,
      tickets: tickets.length ? tickets : undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }


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

              {/* Release + main ticket */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Release / Fix Version</label>
                  <input value={fixVersion} onChange={e => setFixVersion(e.target.value)}
                    placeholder="e.g. S34.X" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Main Ticket</label>
                  <input value={ticketKey} onChange={e => setTicketKey(e.target.value)}
                    placeholder="e.g. EAINT-12107" className={inp + " font-mono uppercase"} />
                </div>
              </div>

              {/* Other tickets */}
              <div>
                <label className={lbl}>Other Tickets in this Deployment</label>
                <input value={ticketsText} onChange={e => setTicketsText(e.target.value)}
                  placeholder="EAINT-12327, EAINT-12412 (comma or space separated)" className={inp + " font-mono"} />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Deployment Date <span className="text-red-500">*</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className={inp} style={{ colorScheme: scheme }} />
                </div>
                <div>
                  <label className={lbl}>Deployment Time <span className="text-red-500">*</span></label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className={inp} style={{ colorScheme: scheme }} />
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
                <button onClick={() => { setStep("ticket"); if (creds) setJiraLoading(true); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  ← Change ticket
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-5 py-4 border-t border-slate-800 shrink-0">
            <button onClick={handleSave} disabled={!canSave}
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
