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

  const doneCount = all.filter(
    (i) => i.fields.status.statusCategory.key === "done"
  ).length;
  const inProgressCount = all.filter(
    (i) => i.fields.status.statusCategory.key === "indeterminate"
  ).length;
  const overdueCount = all.filter(
    (i) =>
      i.fields.duedate &&
      new Date(i.fields.duedate) < new Date() &&
      i.fields.status.statusCategory.key !== "done"
  ).length;

  const topStatuses = Object.entries(byStatus)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Assigned to Me" value={assigned.length} color="blue" />
      <StatCard label="Reported by Me" value={reported.length} color="purple" />
      <StatCard label="In Progress" value={inProgressCount} color="yellow" />
      <StatCard label="Completed" value={doneCount} color="green" />
      {overdueCount > 0 && (
        <div className="col-span-2 sm:col-span-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-600 font-bold text-lg">{overdueCount}</span>
          <span className="text-red-700 text-sm font-medium">overdue issue{overdueCount !== 1 ? "s" : ""} need attention</span>
        </div>
      )}
      {topStatuses.length > 0 && (
        <div className="col-span-2 sm:col-span-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-2 font-medium">Status breakdown</p>
          <div className="flex flex-wrap gap-3">
            {topStatuses.map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-800">{count}</span>
                <span className="text-xs text-gray-500">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "yellow" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
    green: "bg-green-50 border-green-100 text-green-600",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80 font-medium">{label}</p>
    </div>
  );
}
