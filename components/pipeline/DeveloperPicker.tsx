"use client";
// Searchable Jira user picker for the QA-Issue Developer field
// (Faizuddin, 2026-10-27: Developer is always asked, never guessed).
import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";
import { api } from "@/components/pipeline/api";

export interface JiraUser { accountId: string; displayName: string; emailAddress?: string }

function toUsers(data: unknown): JiraUser[] {
  const list = Array.isArray(data) ? data
    : data && typeof data === "object" && Array.isArray((data as { users?: unknown }).users) ? (data as { users: unknown[] }).users
    : [];
  return list
    .filter((u): u is JiraUser => !!u && typeof u === "object" && typeof (u as JiraUser).accountId === "string")
    .map(u => ({ accountId: u.accountId, displayName: u.displayName || u.accountId, emailAddress: u.emailAddress }));
}

export default function DeveloperPicker({ value, onChange }: {
  value: JiraUser | null;
  onChange: (u: JiraUser | null) => void;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<JiraUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await api<unknown>(`/api/pipeline/jira/users?q=${encodeURIComponent(term)}`);
      if (cancelled) return;
      setLoading(false);
      if (r.ok) { setResults(toUsers(r.data)); setError(""); }
      else { setResults([]); setError(r.error); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100">
        <span className="flex-1 min-w-0 truncate">{value.displayName}</span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-500 hover:text-slate-200" aria-label="Clear developer">
          <X size={14} />
        </button>
      </div>
    );
  }

  const showList = q.trim().length >= 2;
  return (
    <div className="relative">
      <input
        id={id}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Type at least 2 letters of a name"
        aria-label="Search developer"
        autoComplete="off"
        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
      />
      {loading && <Loader2 size={14} className="absolute right-3 top-2.5 animate-spin text-slate-500" aria-hidden />}
      {showList && (error || results.length > 0 || !loading) && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 shadow-lg" role="listbox">
          {error && <li className="px-3 py-2 text-xs text-red-300">{error}</li>}
          {!error && results.length === 0 && !loading && <li className="px-3 py-2 text-xs text-slate-500">No one found.</li>}
          {results.map(u => (
            <li key={u.accountId}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => { onChange(u); setQ(""); setResults([]); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                {u.displayName}
                {u.emailAddress && <span className="block text-[11px] text-slate-500">{u.emailAddress}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
