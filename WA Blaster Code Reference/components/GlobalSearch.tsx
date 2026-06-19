"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Kanban, CheckSquare, FileText, ExternalLink, Rocket, CalendarDays, ClipboardList } from "lucide-react";
import clsx from "clsx";
import { getKanbanState, PRIORITY_META } from "@/lib/kanban";
import { getTodos } from "@/lib/todo";
import { getNotes, stripHtml } from "@/lib/notes-store";
import { getDeployments } from "@/lib/deployments";
import { getCalendarEvents } from "@/lib/calendar-events";

interface SearchResult {
  id: string;
  type: "kanban" | "todo" | "note" | "deployment" | "event" | "test";
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSelected(0); return; }

    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const out: SearchResult[] = [];

    const kanban = getKanbanState();
    for (const col of ["urgent", "todo", "ongoing", "on-hold", "finished"] as const) {
      for (const card of kanban[col]) {
        if (
          card.title.toLowerCase().includes(q) ||
          card.description?.toLowerCase().includes(q) ||
          card.jiraKey?.toLowerCase().includes(q) ||
          card.labels.some(l => l.toLowerCase().includes(q))
        ) {
          const pm = PRIORITY_META[card.priority];
          out.push({
            id: card.id, type: "kanban", title: card.title,
            subtitle: card.jiraKey ? `${card.jiraKey} · ${col}` : col,
            href: "/kanban", meta: pm.label,
          });
        }
      }
    }

    for (const todo of getTodos()) {
      if (todo.title.toLowerCase().includes(q) || todo.jiraKey?.toLowerCase().includes(q)) {
        out.push({
          id: todo.id, type: "todo", title: todo.title,
          subtitle: todo.jiraKey ?? (todo.done ? "Done" : "Active"),
          href: "/todo",
        });
      }
    }

    for (const note of getNotes()) {
      const plain = stripHtml(note.content);
      if (note.title.toLowerCase().includes(q) || plain.toLowerCase().includes(q) || note.tags.some(t => t.toLowerCase().includes(q))) {
        const snippet = plain.slice(0, 70) + (plain.length > 70 ? "…" : "");
        out.push({
          id: note.id, type: "note", title: note.title || "Untitled",
          subtitle: snippet, href: "/notes",
        });
      }
    }

    for (const d of getDeployments()) {
      if (
        d.ticketKey.toLowerCase().includes(q) ||
        d.ticketSummary.toLowerCase().includes(q) ||
        d.environment.toLowerCase().includes(q) ||
        d.deployedBy.toLowerCase().includes(q)
      ) {
        out.push({
          id: d.id, type: "deployment",
          title: `${d.ticketKey} ${d.ticketSummary}`.trim(),
          subtitle: `${d.date} · ${d.environment}`,
          href: "/calendar",
        });
      }
    }

    for (const e of getCalendarEvents()) {
      if (e.title.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q)) {
        out.push({
          id: e.id, type: "event", title: e.title,
          subtitle: e.startDate === e.endDate ? e.startDate : `${e.startDate} → ${e.endDate}`,
          href: "/calendar",
        });
      }
    }

    try {
      const testData: { id: string; crKey: string; crSummary: string; suites: { id: string; title: string; cases: { id: string; tsNumber: string }[] }[] }[] =
        JSON.parse(localStorage.getItem("test_tracker_crs") ?? "[]");
      for (const cr of testData) {
        if (cr.crKey.toLowerCase().includes(q) || cr.crSummary.toLowerCase().includes(q)) {
          out.push({ id: cr.id, type: "test", title: cr.crKey, subtitle: cr.crSummary, href: "/tests" });
        }
        for (const suite of cr.suites) {
          if (suite.title.toLowerCase().includes(q)) {
            out.push({ id: suite.id, type: "test", title: suite.title, subtitle: `${cr.crKey} · Suite`, href: "/tests" });
          }
          for (const tc of suite.cases) {
            if (tc.tsNumber.toLowerCase().includes(q)) {
              out.push({ id: tc.id, type: "test", title: tc.tsNumber, subtitle: `${cr.crKey} · ${suite.title}`, href: "/tests" });
            }
          }
        }
      }
    } catch { /* ignore */ }

      setResults(out.slice(0, 15));
      setSelected(0);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) { router.push(results[selected].href); onClose(); }
    if (e.key === "Escape") onClose();
  }

  const typeIcon = { kanban: Kanban, todo: CheckSquare, note: FileText, deployment: Rocket, event: CalendarDays, test: ClipboardList };
  const typeLabel = { kanban: "Kanban", todo: "To-Do", note: "Note", deployment: "Deployment", event: "Event", test: "TS Tracker" };
  const typeColor = { kanban: "text-blue-400", todo: "text-green-400", note: "text-purple-400", deployment: "text-sky-400", event: "text-pink-400", test: "text-amber-400" };

  return (
    <div
      className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <Search size={16} className="text-slate-500 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search cards, notes, tasks, events…"
          aria-label="Global search"
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="text-slate-600 hover:text-slate-400">
            <X size={14} />
          </button>
        )}
        <kbd className="text-[10px] text-slate-700 border border-slate-700 rounded px-1 py-0.5">Esc</kbd>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="py-2 max-h-80 overflow-y-auto">
          {results.map((r, i) => {
            const Icon = typeIcon[r.type];
            return (
              <button
                key={r.id}
                onClick={() => { router.push(r.href); onClose(); }}
                onMouseEnter={() => setSelected(i)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === selected ? "bg-slate-800" : "hover:bg-slate-800/50"
                )}
              >
                <Icon size={14} className={clsx("shrink-0", typeColor[r.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.meta && <span className="text-[10px] text-slate-600">{r.meta}</span>}
                  <span className={clsx("text-[10px] font-medium", typeColor[r.type])}>{typeLabel[r.type]}</span>
                  <ExternalLink size={11} className="text-slate-700" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-600">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}

      {!query && (
        <div className="px-4 py-3 flex gap-4 text-xs text-slate-700">
          <span><kbd className="border border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-slate-700 rounded px-1">↵</kbd> open</span>
          <span><kbd className="border border-slate-700 rounded px-1">Esc</kbd> close</span>
        </div>
      )}
    </div>
  );
}
