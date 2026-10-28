"use client";
import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { reporterIs } from "@/lib/jira";

interface JiraHit { key: string; summary: string; }

// ── Add CR from Jira (search behaviour unchanged from the old page) ──
export function AddCRPanel({ creds, existingKeys, onAdd, onClose }: {
  creds: ReturnType<typeof useApp>["creds"];
  existingKeys: string[];
  onAdd: (key: string, summary: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JiraHit[]>([]);
  const [loading, setLoading] = useState(() => !!creds);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Initial load
  useEffect(() => {
    if (!creds || results.length > 0) return;
    const jql = `${reporterIs(creds)} AND issuetype = Task AND resolution = Unresolved ORDER BY updated DESC`;
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql, maxResults: 30, fields: ["summary"] }) })
      .then(r => r.json()).then(d => setResults((d.issues ?? []).map((i: { key: string; fields: { summary: string } }) => ({ key: i.key, summary: i.fields.summary }))))
      .catch(() => {}).finally(() => setLoading(false));
  }, [creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (!creds || query.length < 2) return;
    const pk = creds.defaultProjectKey;
    const isKey = /^[A-Za-z]+-\d+$/.test(query.trim());
    const isNum = /^\d+$/.test(query.trim());
    const resolved = isNum && pk ? `${pk}-${query.trim()}` : null;
    const jql = resolved ? `key = "${resolved}"` : isKey ? `key = "${query.trim()}"` : pk ? `project = "${pk}" AND issuetype = Task AND text ~ "${query.trim()}"` : `issuetype = Task AND text ~ "${query.trim()}"`;
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: `${jql} ORDER BY updated DESC`, maxResults: 20, fields: ["summary"] }) })
        .then(r => r.json()).then(d => setResults((d.issues ?? []).map((i: { key: string; fields: { summary: string } }) => ({ key: i.key, summary: i.fields.summary }))))
        .catch(() => {}).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [query, creds]);

  const filtered = query.length >= 2 ? results : results.filter(r => {
    const q = query.toLowerCase();
    return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-3 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-300">Add CR</p>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
      </div>
      <div className="relative mb-3">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search CR by key or title…"
          className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        {loading && <Loader2 size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
      </div>
      <div className="max-h-52 overflow-y-auto space-y-1">
        {filtered.length === 0 && !loading && (
          <p className="text-xs text-slate-600 text-center py-4">{query ? "No results" : "Loading recent CRs…"}</p>
        )}
        {filtered.map(r => {
          const already = existingKeys.includes(r.key);
          return (
            <button key={r.key} disabled={already} onClick={() => onAdd(r.key, r.summary)}
              className={clsx("w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors",
                already ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-800"
              )}>
              <span className="font-mono text-blue-400 font-bold mr-2">{r.key}</span>
              <span className="text-slate-300 line-clamp-1">{r.summary}</span>
              {already && <span className="text-slate-600 ml-1">(added)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
