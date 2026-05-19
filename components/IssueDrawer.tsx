"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2, RefreshCw, ChevronLeft, Plus, Rocket } from "lucide-react";
import { JiraCredentials, JiraIssue, JiraComment, statusColor } from "@/lib/jira";
import { getKanbanState, saveKanbanState, KanbanCard, ColumnId, Priority, COLUMN_META } from "@/lib/kanban";
import { getDeployments, saveDeployments, Deployment, DEPLOYMENT_ENVIRONMENTS } from "@/lib/deployments";
import clsx from "clsx";

interface Props {
  issueKey: string;
  creds: JiraCredentials;
  onClose: () => void;
}

function adfToText(node: Record<string, unknown> | null): string {
  if (!node) return "";
  if (node.type === "text") return (node.text as string) ?? "";
  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[]).map(adfToText).join("");
  }
  return "";
}

type ActionPanel = "kanban" | "deployment" | null;

const PRIORITY_OPTIONS: Priority[] = ["urgent", "high", "medium", "low"];
const COLUMN_OPTIONS: ColumnId[] = ["urgent", "todo", "ongoing", "on-hold", "finished"];

export default function IssueDrawer({ issueKey, creds, onClose }: Props) {
  const [keyStack, setKeyStack] = useState<string[]>([issueKey]);
  const currentKey = keyStack[keyStack.length - 1];

  const [issue, setIssue]   = useState<JiraIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);

  // Kanban form state
  const [kanbanCol, setKanbanCol]       = useState<ColumnId>("todo");
  const [kanbanPriority, setKanbanPriority] = useState<Priority>("medium");
  const [kanbanSuccess, setKanbanSuccess] = useState(false);

  // Deployment form state
  const [depDate, setDepDate]         = useState(new Date().toISOString().slice(0, 10));
  const [depTime, setDepTime]         = useState("22:00");
  const [depType, setDepType]         = useState<"day" | "night">("night");
  const [depEnv, setDepEnv]           = useState("Production");
  const [depBy, setDepBy]             = useState("");
  const [depNotes, setDepNotes]       = useState("");
  const [depSuccess, setDepSuccess]   = useState(false);

  async function fetchIssue(key: string) {
    setLoading(true);
    setError("");
    setActionPanel(null);
    setKanbanSuccess(false);
    setDepSuccess(false);
    const params = new URLSearchParams({ baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken });
    const res  = await fetch(`/api/jira/issue/${key}?${params}`);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed to load issue");
    else setIssue(data);
    setLoading(false);
  }

  useEffect(() => {
    setIssue(null);
    fetchIssue(currentKey);
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset stack if issueKey prop changes from outside
  useEffect(() => {
    setKeyStack([issueKey]);
  }, [issueKey]);

  function navigateToParent(parentKey: string) {
    setKeyStack(prev => [...prev, parentKey]);
  }

  function goBack() {
    setKeyStack(prev => prev.slice(0, -1));
  }

  function addToKanban() {
    if (!issue) return;
    const state = getKanbanState();
    const alreadyExists = COLUMN_OPTIONS.some(col =>
      state[col].some(c => c.jiraKey === currentKey)
    );
    if (!alreadyExists) {
      const card: KanbanCard = {
        id: `jira-${currentKey}-${Date.now()}`,
        columnId: kanbanCol,
        type: "jira",
        title: issue.fields.summary,
        priority: kanbanPriority,
        labels: issue.fields.labels,
        checklist: [],
        jiraKey: currentKey,
        jiraStatus: issue.fields.status.name,
        jiraType: issue.fields.issuetype.name,
        jiraProject: issue.fields.project.name,
        createdAt: new Date().toISOString(),
        columnEnteredAt: new Date().toISOString(),
      };
      state[kanbanCol] = [...state[kanbanCol], card];
      saveKanbanState(state);
    }
    setKanbanSuccess(true);
  }

  function scheduleDeployment() {
    if (!issue) return;
    const dep: Deployment = {
      id: `dep-${Date.now()}`,
      ticketKey: currentKey,
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

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {keyStack.length > 1 && (
              <button onClick={goBack} className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800" aria-label="Go back">
                <ChevronLeft size={16} />
              </button>
            )}
            <span className="text-sm font-mono font-bold text-blue-400">{currentKey}</span>
            {issue && (
              <a href={`${creds.baseUrl}/browse/${currentKey}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-blue-400">
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => fetchIssue(currentKey)} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800">
              <RefreshCw size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800" aria-label="Close drawer">
              <X size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{error}</div>
        ) : issue ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Summary */}
            <div>
              <h2 className="text-base font-semibold text-slate-100 leading-snug">{issue.fields.summary}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", statusColor(issue.fields.status.statusCategory.key))}>
                  {issue.fields.status.name}
                </span>
                {issue.fields.priority && (
                  <span className="text-xs text-slate-500">{issue.fields.priority.name} Priority</span>
                )}
                <span className="text-xs text-slate-600">{issue.fields.issuetype.name}</span>
              </div>
            </div>

            {/* Parent breadcrumb — clicking opens in drawer */}
            {issue.fields.parent && (
              <div className="flex items-center gap-1.5 text-xs -mt-2">
                <span className="text-slate-600 text-[10px] uppercase tracking-wide font-semibold">Parent</span>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => navigateToParent(issue.fields.parent!.key)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-600/60 hover:bg-blue-950/20 transition-colors group text-left"
                >
                  <span className="text-[10px] text-slate-500 font-medium">{issue.fields.parent.fields.issuetype.name}</span>
                  <span className="text-xs font-mono text-blue-400 font-semibold group-hover:underline">{issue.fields.parent.key}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">{issue.fields.parent.fields.summary}</span>
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 -mt-1">
              <button
                onClick={() => setActionPanel(p => p === "kanban" ? null : "kanban")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors",
                  actionPanel === "kanban"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-600/60 hover:bg-blue-950/20"
                )}
              >
                <Plus size={12} />
                Add to Kanban
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
                <Rocket size={12} />
                Schedule Deployment
              </button>
            </div>

            {/* Add to Kanban panel */}
            {actionPanel === "kanban" && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add to Kanban Board</p>
                {kanbanSuccess ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">Added to Kanban!</span>
                    <button onClick={() => { setKanbanSuccess(false); setActionPanel(null); }} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Column</label>
                        <select
                          value={kanbanCol}
                          onChange={e => setKanbanCol(e.target.value as ColumnId)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {COLUMN_OPTIONS.map(col => (
                            <option key={col} value={col}>{COLUMN_META[col].label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Priority</label>
                        <select
                          value={kanbanPriority}
                          onChange={e => setKanbanPriority(e.target.value as Priority)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {PRIORITY_OPTIONS.map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={addToKanban}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Add to {COLUMN_META[kanbanCol].label}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Schedule Deployment panel */}
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
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                        <input
                          type="date"
                          value={depDate}
                          onChange={e => setDepDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Time</label>
                        <input
                          type="time"
                          value={depTime}
                          onChange={e => setDepTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                        <select
                          value={depType}
                          onChange={e => setDepType(e.target.value as "day" | "night")}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="day">Day Deployment</option>
                          <option value="night">Night Deployment</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Environment</label>
                        <select
                          value={depEnv}
                          onChange={e => setDepEnv(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          {DEPLOYMENT_ENVIRONMENTS.map(env => (
                            <option key={env} value={env}>{env}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Deployed By</label>
                      <input
                        type="text"
                        value={depBy}
                        onChange={e => setDepBy(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Notes</label>
                      <textarea
                        value={depNotes}
                        onChange={e => setDepNotes(e.target.value)}
                        placeholder="Optional notes..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={scheduleDeployment}
                      disabled={!depDate || !depTime}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Schedule for {depDate}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetaItem label="Project"  value={issue.fields.project.name} />
              <MetaItem label="Reporter" value={issue.fields.reporter?.displayName ?? "—"} />
              <MetaItem label="Assignee" value={issue.fields.assignee?.displayName ?? "Unassigned"} />
              <MetaItem label="Due"      value={issue.fields.duedate ? new Date(issue.fields.duedate).toLocaleDateString() : "—"} />
              <MetaItem label="Created"  value={new Date(issue.fields.created).toLocaleDateString()} />
              <MetaItem label="Updated"  value={new Date(issue.fields.updated).toLocaleDateString()} />
            </div>

            {/* Description */}
            {issue.fields.description && (
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-800/60 rounded-lg p-3 border border-slate-700">
                  {adfToText(issue.fields.description) || "No description"}
                </p>
              </div>
            )}

            {/* Labels */}
            {issue.fields.labels.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Labels</h3>
                <div className="flex flex-wrap gap-1">
                  {issue.fields.labels.map(l => (
                    <span key={l} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments — read only */}
            {comments.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  Comments ({issue.fields.comment?.total ?? 0})
                </h3>
                <div className="space-y-3">
                  {comments.slice(-8).map(c => (
                    <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-300">{c.author.displayName}</span>
                        <span className="text-xs text-slate-600">{new Date(c.created).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{adfToText(c.body)}</p>
                    </div>
                  ))}
                  {(issue.fields.comment?.total ?? 0) > 8 && (
                    <p className="text-xs text-slate-600 text-center">Showing last 8 of {issue.fields.comment?.total} comments</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-sm font-medium text-slate-300 truncate">{value}</p>
    </div>
  );
}
