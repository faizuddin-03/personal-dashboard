"use client";
import { JiraIssue, statusColor, priorityColor } from "@/lib/jira";
import { ExternalLink, Clock, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface Props {
  issue: JiraIssue;
  baseUrl: string;
  onClick: () => void;
}

export default function IssueCard({ issue, baseUrl, onClick }: Props) {
  const { fields } = issue;
  const statusKey = fields.status.statusCategory.key;
  const isOverdue =
    fields.duedate && new Date(fields.duedate) < new Date() && statusKey !== "done";

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-600 font-semibold shrink-0">
              {issue.key}
            </span>
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                statusColor(statusKey)
              )}
            >
              {fields.status.name}
            </span>
            {fields.priority && (
              <span
                className={clsx("text-xs font-medium", priorityColor(fields.priority.name))}
              >
                {fields.priority.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 font-medium line-clamp-2 leading-snug">
            {fields.summary}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded bg-gray-100 text-center leading-4 text-gray-600 text-[10px] font-bold">
                {fields.issuetype.name[0]}
              </span>
              {fields.issuetype.name}
            </span>
            <span className="text-gray-300">·</span>
            <span>{fields.project.name}</span>
            {isOverdue && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle size={11} />
                  Overdue
                </span>
              </>
            )}
            {fields.duedate && !isOverdue && statusKey !== "done" && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Due {new Date(fields.duedate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
          {fields.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {fields.labels.slice(0, 3).map((l) => (
                <span key={l} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
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
          className="text-gray-300 hover:text-blue-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}
