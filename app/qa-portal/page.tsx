"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ExternalLink, Loader2, RefreshCw, AlertCircle } from "lucide-react";

// Read-only view of Faizuddin's QA Portal work: tasks where he is QA PIC,
// reminders and active deployment windows (2026-10-29). Data via /api/qa-portal.

interface Task {
  id: string; key: string | null; title: string; status: string; priority: string | null;
  qaPic: string[]; devPic: string | null; etaTestingDate: number | null; dueDate: number | null;
  deploymentDate: number | null; codeMergeEnv: string | null; done: boolean;
}
interface Window {
  id: string; name: string; description: string | null; scheduledDate: number | null;
  fixVersion: string | null; goAheadStatus: string | null; qaPics: string[]; mine: boolean;
}
interface Reminder { id: string; text?: string; dueAt?: number; jiraKey?: string }
interface PortalData {
  portal: string;
  me: { name: string; fullName: string };
  tasks: Task[];
  reminders: { count: number; due: number; upcoming: number; items: Reminder[] };
  windows: Window[];
}

const STATUS_LABELS: Record<string, string> = {
  qa_study: "QA Study", ba_estimate: "BA Estimate", qa_draft: "QA Draft", qa_testing: "QA Testing",
  qa_done: "QA Done", no_testing: "No Testing", work_todo: "To Do", work_doing: "Doing",
};
const STATUS_STYLES: Record<string, string> = {
  qa_study: "bg-purple-900/50 text-purple-300", ba_estimate: "bg-amber-900/50 text-amber-300",
  qa_draft: "bg-sky-900/50 text-sky-300", qa_testing: "bg-blue-900/60 text-blue-300",
  qa_done: "bg-green-900/50 text-green-300", no_testing: "bg-slate-800 text-slate-400",
  work_todo: "bg-slate-800 text-slate-300", work_doing: "bg-blue-900/60 text-blue-300",
};

const fmt = (ms: number | null | undefined) =>
  ms ? new Date(Number(ms)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function QaPortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDone, setShowDone] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/qa-portal", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Could not load the QA Portal");
      else setData(json);
    } catch {
      setError("Network error — is the dashboard server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const tasks = (data?.tasks ?? []).filter(t => showDone || !t.done);
  const openCount = (data?.tasks ?? []).filter(t => !t.done).length;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-200">QA Portal</h1>
        {data && <span className="text-xs text-slate-500">as {data.me.fullName}</span>}
        <div className="ml-auto flex items-center gap-2">
          <a href={data?.portal ?? "http://10.30.10.214"} target="_blank" rel="noreferrer" className={secondaryBtn}>
            <ExternalLink size={13} /> Open portal
          </a>
          <button onClick={load} disabled={loading} className={secondaryBtn}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {!data && loading && <p className="text-sm text-slate-500">Loading…</p>}

        {data && (
          <>
            {/* ── My tasks ── */}
            <Section
              title={`My tasks (${openCount} open)`}
              right={
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
                  Show done
                </label>
              }
            >
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                        <th className="px-2 py-2 font-medium">Ticket</th>
                        <th className="px-2 py-2 font-medium">Title</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                        <th className="px-2 py-2 font-medium">Priority</th>
                        <th className="px-2 py-2 font-medium">ETA testing</th>
                        <th className="px-2 py-2 font-medium">Due</th>
                        <th className="px-2 py-2 font-medium">Deployment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => (
                        <tr key={t.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                          <td className="px-2 py-2 whitespace-nowrap font-mono text-xs text-slate-300">{t.key ?? "—"}</td>
                          <td className="px-2 py-2 text-slate-200">
                            <a href={`${data.portal}/tasks/${t.id}`} target="_blank" rel="noreferrer" className="hover:underline">{t.title}</a>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[t.status] ?? "bg-slate-800 text-slate-300")}>
                              {STATUS_LABELS[t.status] ?? t.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-400 capitalize">{t.priority ?? "—"}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-400">{fmt(t.etaTestingDate)}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-400">{fmt(t.dueDate)}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-400">{fmt(t.deploymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* ── Reminders ── */}
            <Section title={`My reminders (${data.reminders.due} due, ${data.reminders.upcoming} upcoming)`}>
              {data.reminders.items.length === 0 ? (
                <p className="text-sm text-slate-500">No open reminders.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.reminders.items.map(r => (
                    <li key={r.id} className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-slate-500 w-28 shrink-0">{fmt(r.dueAt)}</span>
                      {r.jiraKey && <span className="font-mono text-xs text-slate-400">{r.jiraKey}</span>}
                      <span className="text-slate-200">{r.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* ── Deployment windows ── */}
            <Section title="Active deployment windows">
              {data.windows.length === 0 ? (
                <p className="text-sm text-slate-500">No active windows.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[...data.windows]
                    .sort((a, b) => (a.scheduledDate ?? 0) - (b.scheduledDate ?? 0))
                    .map(w => (
                      <div key={w.id} className={clsx("rounded-xl border p-3", w.mine ? "border-blue-700/60 bg-blue-950/20" : "border-slate-800 bg-slate-900/50")}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200">{w.name}</p>
                          {w.mine && <span className="text-xs bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">mine</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{fmt(w.scheduledDate)}{w.fixVersion ? ` · ${w.fixVersion}` : ""}</p>
                        {w.description && <p className="text-xs text-slate-500 mt-1">{w.description}</p>}
                        {w.qaPics.length > 0 && <p className="text-xs text-slate-500 mt-1">QA: {w.qaPics.join(", ")}</p>}
                      </div>
                    ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

const secondaryBtn = "flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40";

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center mb-4">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}
