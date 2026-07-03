"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink, Loader2, RefreshCw, ChevronLeft, Plus, Rocket, Ticket,
} from "lucide-react";
import { JiraCredentials, JiraIssue, JiraComment, statusColor, priorityColor } from "@/lib/jira";
import { getKanbanState, saveKanbanState, KanbanCard, ColumnId, Priority, COLUMN_META } from "@/lib/kanban";
import { getDeployments, saveDeployments, Deployment, DEPLOYMENT_ENVIRONMENTS } from "@/lib/deployments";
import AdfRenderer from "@/components/AdfRenderer";
import { useApp } from "@/components/AppShell";
import clsx from "clsx";

type ActionPanel = "kanban" | "deployment" | null;

const PRIORITY_OPTIONS: Priority[] = ["urgent", "high", "medium", "low"];
const COLUMN_OPTIONS: ColumnId[] = ["urgent", "todo", "ongoing", "on-hold", "finished"];

export default function JiraIssuePage({ params }: { params: Promise<{ key: string }> }) {
  const { key: issueKey } = use(params);
  const router = useRouter();
  const { creds, openSettings } = useApp();

  const [issue, setIssue]     = useState<JiraIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);

  // Kanban form
  const [kanbanCol, setKanbanCol]             = useState<ColumnId>("todo");
  const [kanbanPriority, setKanbanPriority]   = useState<Priority>("medium");
  const [kanbanSuccess, setKanbanSuccess]     = useState(false);
  const [kanbanAlreadyExists, setKanbanAlreadyExists] = useState(false);

  // Deployment form
  const [depDate, setDepDate]       = useState(new Date().toISOString().slice(0, 10));
  const [depTime, setDepTime]       = useState("22:00");
  const [depType, setDepType]       = useState<"day" | "night">("night");
  const [depEnv, setDepEnv]         = useState("Production");
  const [depBy, setDepBy]           = useState("");
  const [depNotes, setDepNotes]     = useState("");
  const [depSuccess, setDepSuccess] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken });
    try {
      const res  = await fetch(`/api/jira/issue/${issueKey}?${params}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Failed to load issue");
      else setIssue(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [creds, issueKey]);

  useEffect(() => { fetchIssue(); }, [fetchIssue]);

  function addToKanban() {
    if (!issue) return;
    const state = getKanbanState();
    const alreadyExists = COLUMN_OPTIONS.some(col =>
      state[col].some(c => c.jiraKey === issueKey)
    );
    if (alreadyExists) { setKanbanAlreadyExists(true); return; }
    const card: KanbanCard = {
      id: `jira-${issueKey}-${Date.now()}`,
      columnId: kanbanCol,
      type: "jira",
      boardType: "task",
      title: issue.fields.summary,
      priority: kanbanPriority,
      labels: issue.fields.labels,
      checklist: [],
      jiraKey: issueKey,
      jiraStatus: issue.fields.status.name,
      jiraType: issue.fields.issuetype.name,
      jiraProject: issue.fields.project.name,
      createdAt: new Date().toISOString(),
      columnEnteredAt: new Date().toISOString(),
    };
    state[kanbanCol] = [...state[kanbanCol], card];
    saveKanbanState(state);
    setKanbanSuccess(true);
  }

  function scheduleDeployment() {
    if (!issue) return;
    const dep: Deployment = {
      id: `dep-${Date.now()}`,
      ticketKey: issueKey,
      ticketSummary: issue.fields.summary,
      date: depDate,
      time: depTime,
      type: depType,
      environment: depEnv,
      deployedBy: depBy,
      rollbackPlan: "",
      notes: depNotes,
      status: "planned",
      createdAt: new Date().toISOString(),
    };
    saveDeployments([...getDeployments(), dep]);
    setDepSuccess(true);
  }

  const comments: JiraComment[] = issue?.fields.comment?.comments ?? [];

  if (!creds) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <p className="text-slate-500 mb-4">Connect Jira to view ticket details.</p>
        <button onClick={openSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          Connect Jira
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>
          <Ticket size={15} className="text-slate-500" />
          <span className="text-sm font-mono font-bold text-blue-400">{issueKey}</span>
          {issue && (
            <a
              href={`${creds.baseUrl}/browse/${issueKey}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-blue-400 transition-colors"
              title="Open in Jira"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
        <button
          onClick={fetchIssue}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center py-24 text-red-400 text-sm">{error}</div>
      ) : issue ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* Summary + status */}
            <div>
              <h1 className="text-xl font-bold text-slate-100 leading-snug mb-3">{issue.fields.summary}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx("text-xs px-2.5 py-1 rounded-full font-medium", statusColor(issue.fields.status.statusCategory.key))}>
                  {issue.fields.status.name}
                </span>
                {issue.fields.priority && (
                  <span className={clsx("text-xs font-medium flex items-center gap-1", priorityColor(issue.fields.priority.name))}>
                    {issue.fields.priority.iconUrl && (
                      <img src={issue.fields.priority.iconUrl} alt="" className="w-3.5 h-3.5" />
                    )}
                    {issue.fields.priority.name}
                  </span>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  {issue.fields.issuetype.iconUrl && (
                    <img src={issue.fields.issuetype.iconUrl} alt="" className="w-3.5 h-3.5" />
                  )}
                  {issue.fields.issuetype.name}
                </span>
                <span className="text-xs text-slate-600">{issue.fields.project.name} ({issue.fields.project.key})</span>
              </div>
            </div>

            {/* Parent breadcrumb */}
            {issue.fields.parent && (
              <div className="flex items-center gap-1.5 text-xs -mt-3">
                <span className="text-slate-600 uppercase tracking-wide font-semibold">Parent</span>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => router.push(`/jira/${issue.fields.parent!.key}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-600/60 hover:bg-blue-950/20 transition-colors group text-left"
                >
                  <span className="text-xs text-slate-500 font-medium">{issue.fields.parent.fields.issuetype.name}</span>
                  <span className="text-xs font-mono text-blue-400 font-semibold group-hover:underline">{issue.fields.parent.key}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[300px]">{issue.fields.parent.fields.summary}</span>
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActionPanel(p => p === "kanban" ? null : "kanban")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                  actionPanel === "kanban"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-600/60 hover:bg-blue-950/20"
                )}
              >
                <Plus size={12} /> Add to Kanban
              </button>
              <button
                onClick={() => setActionPanel(p => p === "deployment" ? null : "deployment")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                  actionPanel === "deployment"
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-600/60 hover:bg-purple-950/20"
                )}
              >
                <Rocket size={12} /> Schedule Deployment
              </button>
              <a
                href={`${creds.baseUrl}/browse/${issueKey}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100"
              >
                <ExternalLink size={12} /> Open in Jira
              </a>
            </div>

            {/* Kanban panel */}
            {actionPanel === "kanban" && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add to Kanban Board</p>
                {kanbanSuccess ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">Added to Kanban!</span>
                    <button onClick={() => { setKanbanSuccess(false); setActionPanel(null); }} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
                  </div>
                ) : kanbanAlreadyExists ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-400">Already on the Kanban board</span>
                    <button onClick={() => { setKanbanAlreadyExists(false); setActionPanel(null); }} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Column</label>
                        <select value={kanbanCol} onChange={e => setKanbanCol(e.target.value as ColumnId)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                          {COLUMN_OPTIONS.map(col => <option key={col} value={col}>{COLUMN_META[col].label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Priority</label>
                        <select value={kanbanPriority} onChange={e => setKanbanPriority(e.target.value as Priority)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={addToKanban} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
                      Add to {COLUMN_META[kanbanCol].label}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Deployment panel */}
            {actionPanel === "deployment" && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Schedule Deployment</p>
                {depSuccess ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">Deployment scheduled!</span>
                    <button onClick={() => { setDepSuccess(false); setActionPanel(null); }} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                        <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Time</label>
                        <input type="time" value={depTime} onChange={e => setDepTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                        <select value={depType} onChange={e => setDepType(e.target.value as "day" | "night")}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500">
                          <option value="day">Day Deployment</option>
                          <option value="night">Night Deployment</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Environment</label>
                        <select value={depEnv} onChange={e => setDepEnv(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500">
                          {DEPLOYMENT_ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Deployed By</label>
                      <input type="text" value={depBy} onChange={e => setDepBy(e.target.value)} placeholder="Your name"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Notes</label>
                      <textarea value={depNotes} onChange={e => setDepNotes(e.target.value)} placeholder="Optional notes..." rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none" />
                    </div>
                    <button onClick={scheduleDeployment} disabled={!depDate || !depTime}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
                      Schedule for {depDate}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Two-column layout: meta + description side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

              {/* Sidebar — meta details */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</p>
                  <MetaRow label="Project"  value={issue.fields.project.name} />
                  <MetaRow label="Type"     value={issue.fields.issuetype.name} icon={issue.fields.issuetype.iconUrl} />
                  <MetaRow label="Priority" value={issue.fields.priority?.name ?? "—"} icon={issue.fields.priority?.iconUrl} />
                  <MetaRow label="Status"   value={issue.fields.status.name} />
                  <MetaRow label="Assignee" value={issue.fields.assignee?.displayName ?? "Unassigned"} avatar={issue.fields.assignee?.avatarUrls["48x48"]} />
                  <MetaRow label="Reporter" value={issue.fields.reporter?.displayName ?? "—"} avatar={issue.fields.reporter?.avatarUrls["48x48"]} />
                  <MetaRow label="Due Date" value={issue.fields.duedate ? new Date(issue.fields.duedate + "T12:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                  <MetaRow label="Created"  value={new Date(issue.fields.created).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} />
                  <MetaRow label="Updated"  value={new Date(issue.fields.updated).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} />
                  {issue.fields.fixVersions.length > 0 && (
                    <MetaRow label="Fix Version" value={issue.fields.fixVersions.map(v => v.name).join(", ")} />
                  )}
                </div>

                {/* Labels */}
                {issue.fields.labels.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Labels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.fields.labels.map(l => (
                        <span key={l} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main — description + comments */}
              <div className="space-y-6 min-w-0">
                {/* Description */}
                {issue.fields.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
                      <AdfRenderer node={issue.fields.description as Record<string, unknown>} />
                    </div>
                  </div>
                )}

                {!issue.fields.description && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-600">No description</p>
                  </div>
                )}

                {/* Comments */}
                {comments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Comments ({issue.fields.comment?.total ?? 0})
                    </h3>
                    <div className="space-y-3">
                      {comments.map(c => (
                        <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {c.author.avatarUrls["48x48"] && (
                              <img src={c.author.avatarUrls["48x48"]} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <span className="text-xs font-semibold text-slate-300">{c.author.displayName}</span>
                            <span className="text-xs text-slate-600 ml-auto">
                              {new Date(c.created).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                              {" "}
                              {new Date(c.created).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <AdfRenderer node={c.body as Record<string, unknown>} />
                        </div>
                      ))}
                      {(issue.fields.comment?.total ?? 0) > (issue.fields.comment?.comments?.length ?? 0) && (
                        <p className="text-xs text-slate-600 text-center py-2">
                          Showing last {issue.fields.comment?.comments?.length ?? 0} of {issue.fields.comment?.total} comments
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetaRow({ label, value, icon, avatar }: { label: string; value: string; icon?: string; avatar?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-300 font-medium text-right flex items-center gap-1.5 min-w-0">
        {avatar && <img src={avatar} alt="" className="w-4 h-4 rounded-full shrink-0" />}
        {icon && !avatar && <img src={icon} alt="" className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}
