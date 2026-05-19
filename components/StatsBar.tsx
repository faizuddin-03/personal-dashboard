"use client";
import { JiraIssue } from "@/lib/jira";

interface Props {
  assigned: JiraIssue[];
  reported: JiraIssue[];
}

export default function StatsBar({ assigned, reported }: Props) {
  const all = [...assigned, ...reported];
  const byStatus = all.reduce<Record<string, number>>((acc, i) => {
    const name = i.fields.status.name;
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  const doneCount = all.filter((i) => i.fields.status.statusCategory.key === "done").length;
  const inProgressCount = all.filter((i) => i.fields.status.statusCategory.key === "indeterminate").length;
  const overdueCount = all.filter(
    (i) =>
      i.fields.duedate &&
      new Date(i.fields.duedate) < new Date() &&
      i.fields.status.statusCategory.key !== "done"
  ).length;

  const topStatuses = Object.entries(byStatus).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Assigned to Me" value={assigned.length} color="blue" />
      <StatCard label="Reported by Me" value={reported.length} color="purple" />
      <StatCard label="In Progress" value={inProgressCount} color="yellow" />
      <StatCard label="Completed" value={doneCount} color="green" />

      {overdueCount > 0 && (
        <div className="col-span-2 sm:col-span-4 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-400 font-bold text-lg">{overdueCount}</span>
          <span className="text-red-400 text-sm">
            overdue issue{overdueCount !== 1 ? "s" : ""} need attention
          </span>
        </div>
      )}

      {topStatuses.length > 0 && (
        <div className="col-span-2 sm:col-span-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-600 mb-2 font-medium uppercase tracking-wide">Status breakdown</p>
          <div className="flex flex-wrap gap-4">
            {topStatuses.map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-200">{count}</span>
                <span className="text-xs text-slate-500">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "purple" | "yellow" | "green" }) {
  const colors = {
    blue: "bg-blue-950/40 border-blue-800/50 text-blue-400",
    purple: "bg-purple-950/40 border-purple-800/50 text-purple-400",
    yellow: "bg-yellow-950/40 border-yellow-800/50 text-yellow-400",
    green: "bg-green-950/40 border-green-800/50 text-green-400",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-70 font-medium">{label}</p>
    </div>
  );
}
