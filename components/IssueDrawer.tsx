"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { JiraCredentials, JiraIssue, JiraComment, statusColor } from "@/lib/jira";
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

export default function IssueDrawer({ issueKey, creds, onClose }: Props) {
  const [issue, setIssue]   = useState<JiraIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  async function fetchIssue() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken });
    const res  = await fetch(`/api/jira/issue/${issueKey}?${params}`);
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed to load issue");
    else setIssue(data);
    setLoading(false);
  }

  useEffect(() => { fetchIssue(); }, [issueKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const comments: JiraComment[] = issue?.fields.comment?.comments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-blue-400">{issueKey}</span>
            {issue && (
              <a href={`${creds.baseUrl}/browse/${issueKey}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-blue-400">
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchIssue} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800">
              <RefreshCw size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800">
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

            {/* Parent breadcrumb */}
            {issue.fields.parent && (
              <div className="flex items-center gap-1.5 text-xs -mt-2">
                <span className="text-slate-600 text-[10px] uppercase tracking-wide font-semibold">Parent</span>
                <span className="text-slate-700">·</span>
                <a
                  href={`${creds.baseUrl}/browse/${issue.fields.parent.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-600/60 hover:bg-blue-950/20 transition-colors group"
                >
                  <span className="text-[10px] text-slate-500 font-medium">{issue.fields.parent.fields.issuetype.name}</span>
                  <span className="text-xs font-mono text-blue-400 font-semibold group-hover:underline">{issue.fields.parent.key}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">{issue.fields.parent.fields.summary}</span>
                  <ExternalLink size={10} className="text-slate-600 group-hover:text-blue-400 shrink-0" />
                </a>
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
