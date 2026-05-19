"use client";
import { useEffect, useState } from "react";
import {
  X, ExternalLink, ChevronDown, Send, Loader2, RefreshCw
} from "lucide-react";
import {
  JiraCredentials, JiraIssue, JiraTransition, JiraComment,
  statusColor,
} from "@/lib/jira";
import clsx from "clsx";

interface Props {
  issueKey: string;
  creds: JiraCredentials;
  onClose: () => void;
  onUpdated: () => void;
}

function adfToText(node: Record<string, unknown> | null): string {
  if (!node) return "";
  if (node.type === "text") return (node.text as string) ?? "";
  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[]).map(adfToText).join("");
  }
  return "";
}

export default function IssueDrawer({ issueKey, creds, onClose, onUpdated }: Props) {
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [transitions, setTransitions] = useState<JiraTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showTransitions, setShowTransitions] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  async function fetchIssue() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      baseUrl: creds.baseUrl,
      email: creds.email,
      apiToken: creds.apiToken,
    });
    const res = await fetch(`/api/jira/issue/${issueKey}?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load issue");
    } else {
      setIssue(data);
    }
    setLoading(false);
  }

  async function fetchTransitions() {
    const params = new URLSearchParams({
      baseUrl: creds.baseUrl,
      email: creds.email,
      apiToken: creds.apiToken,
    });
    const res = await fetch(`/api/jira/issue/${issueKey}/transitions?${params}`);
    const data = await res.json();
    if (res.ok) setTransitions(data.transitions ?? []);
  }

  useEffect(() => {
    fetchIssue();
    fetchTransitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueKey]);

  async function handleTransition(t: JiraTransition) {
    setTransitioning(true);
    setShowTransitions(false);
    const res = await fetch(`/api/jira/issue/${issueKey}/transitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, transitionId: t.id }),
    });
    if (res.ok) {
      setActionMsg(`Status updated to "${t.name}"`);
      await fetchIssue();
      onUpdated();
    } else {
      setActionMsg("Failed to update status");
    }
    setTransitioning(false);
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/jira/issue/${issueKey}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, body: comment }),
    });
    if (res.ok) {
      setComment("");
      setActionMsg("Comment added");
      await fetchIssue();
    } else {
      setActionMsg("Failed to add comment");
    }
    setSubmitting(false);
    setTimeout(() => setActionMsg(""), 3000);
  }

  const comments: JiraComment[] = issue?.fields.comment?.comments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-blue-600">{issueKey}</span>
            {issue && (
              <a
                href={`${creds.baseUrl}/browse/${issueKey}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-500"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchIssue} className="text-gray-400 hover:text-gray-600 p-1">
              <RefreshCw size={15} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
        ) : issue ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Summary */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                  {issue.fields.summary}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      statusColor(issue.fields.status.statusCategory.key)
                    )}
                  >
                    {issue.fields.status.name}
                  </span>
                  {issue.fields.priority && (
                    <span className="text-xs text-gray-500">{issue.fields.priority.name} Priority</span>
                  )}
                  <span className="text-xs text-gray-400">{issue.fields.issuetype.name}</span>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MetaItem label="Project" value={issue.fields.project.name} />
                <MetaItem label="Reporter" value={issue.fields.reporter?.displayName ?? "—"} />
                <MetaItem label="Assignee" value={issue.fields.assignee?.displayName ?? "Unassigned"} />
                <MetaItem label="Due" value={issue.fields.duedate ? new Date(issue.fields.duedate).toLocaleDateString() : "—"} />
                <MetaItem label="Created" value={new Date(issue.fields.created).toLocaleDateString()} />
                <MetaItem label="Updated" value={new Date(issue.fields.updated).toLocaleDateString()} />
              </div>

              {/* Description */}
              {issue.fields.description && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3">
                    {adfToText(issue.fields.description) || "No description"}
                  </p>
                </div>
              )}

              {/* Transition */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowTransitions((v) => !v)}
                    disabled={transitioning}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {transitioning ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Change Status
                  </button>
                  {showTransitions && transitions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                      {transitions.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTransition(t)}
                          className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action message */}
              {actionMsg && (
                <p className="text-xs text-green-600 font-medium">{actionMsg}</p>
              )}

              {/* Comments */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Comments ({issue.fields.comment?.total ?? 0})
                </h3>
                <div className="space-y-3">
                  {comments.slice(-5).map((c) => (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{c.author.displayName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {adfToText(c.body)}
                      </p>
                    </div>
                  ))}
                  {(issue.fields.comment?.total ?? 0) > 5 && (
                    <p className="text-xs text-gray-400 text-center">
                      Showing last 5 of {issue.fields.comment?.total} comments
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Add comment */}
        {issue && (
          <form onSubmit={handleComment} className="p-4 border-t shrink-0 bg-white">
            <div className="flex gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!comment.trim() || submitting}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
    </div>
  );
}
