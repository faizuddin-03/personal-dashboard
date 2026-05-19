"use client";
import { JiraIssue, statusColor, priorityColor } from "@/lib/jira";
import { ExternalLink, Clock, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface Props {
  issue: JiraIssue;
  baseUrl: string;
  onClick: () => void;
}

const STALE_DAYS = 7;

export default function IssueCard({ issue, baseUrl, onClick }: Props) {
  const { fields } = issue;
  const statusKey = fields.status.statusCategory.key;
  const isOverdue =
    fields.duedate && new Date(fields.duedate) < new Date() && statusKey !== "done";
  const isStale = statusKey !== "done" && fields.updated &&
    (Date.now() - new Date(fields.updated).getTime()) > STALE_DAYS * 86400000;
  const daysSinceUpdate = fields.updated
    ? Math.floor((Date.now() - new Date(fields.updated).getTime()) / 86400000)
    : 0;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "border rounded-xl p-4 transition-all cursor-pointer group",
        isStale
          ? "bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60 hover:bg-amber-950/30"
          : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {fields.parent && (
            <div className="flex items-center gap-1 mb-1">
              <a
                href={`${baseUrl}/browse/${fields.parent.key}`}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[10px] font-mono text-slate-500 hover:text-blue-400 transition-colors"
                title={fields.parent.fields.summary}
              >
                {fields.parent.key}
              </a>
              <span className="text-[10px] text-slate-700">›</span>
              <span className="text-[10px] font-mono text-blue-400 font-semibold">{issue.key}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {!fields.parent && (
              <span className="text-xs font-mono text-blue-400 font-semibold shrink-0">
                {issue.key}
              </span>
            )}
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                statusColor(statusKey)
              )}
            >
              {fields.status.name}
            </span>
            {fields.priority && (
              <span className={clsx("text-xs font-medium", priorityColor(fields.priority.name))}>
                {fields.priority.name}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-2 leading-snug">
            {fields.summary}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded bg-slate-700 text-center leading-4 text-slate-400 text-[10px] font-bold">
                {fields.issuetype.name[0]}
              </span>
              {fields.issuetype.name}
            </span>
            <span className="text-slate-700">·</span>
            <span>{fields.project.name}</span>
            {isOverdue && (
              <>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1 text-red-400">
                  <AlertTriangle size={11} />
                  Overdue
                </span>
              </>
            )}
            {fields.duedate && !isOverdue && statusKey !== "done" && (
              <>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Due {new Date(fields.duedate).toLocaleDateString()}
                </span>
              </>
            )}
            {isStale && (
              <>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1 text-amber-500" title={`Last updated ${daysSinceUpdate} days ago`}>
                  <AlertTriangle size={11} />
                  Stale ({daysSinceUpdate}d)
                </span>
              </>
            )}
          </div>
          {fields.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {fields.labels.slice(0, 3).map((l) => (
                <span key={l} className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <a
          href={`${baseUrl}/browse/${issue.key}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-700 hover:text-blue-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
