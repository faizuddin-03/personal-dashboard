"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  BookOpen, ExternalLink, Search, Building2, Layers, FlaskConical, MapPin,
  FileText, CheckCircle2, HelpCircle, ClipboardList, Bot, AlertTriangle,
  Ban, CircleDashed, Link2, StickyNote, X,
} from "lucide-react";
import clsx from "clsx";
import {
  TICKET_STUDIES, automationTotals, getStudyNotes, saveStudyNote,
  type TicketStudy, type AutomationVerdict, type StudyBlockTone,
} from "@/lib/ticketStudies";

// ── Shared bits ───────────────────────────────────────────
const VERDICT_META: Record<AutomationVerdict, { label: string; icon: typeof Bot; chip: string; dot: string }> = {
  automatable: { label: "Automatable", icon: CheckCircle2,  chip: "bg-green-900/40 border-green-700/60 text-green-300", dot: "bg-green-500" },
  partly:      { label: "Partly",      icon: CircleDashed,  chip: "bg-amber-900/40 border-amber-700/60 text-amber-300", dot: "bg-amber-500" },
  manual:      { label: "Manual only", icon: Ban,           chip: "bg-red-900/40 border-red-700/60 text-red-300",       dot: "bg-red-500" },
};

const BLOCK_TONE: Record<StudyBlockTone, string> = {
  e2e:        "bg-blue-900/40 border-blue-700/60 text-blue-300",
  negative:   "bg-orange-900/40 border-orange-700/60 text-orange-300",
  edge:       "bg-purple-900/40 border-purple-700/60 text-purple-300",
  regression: "bg-teal-900/40 border-teal-700/60 text-teal-300",
};

function Section({ icon: Icon, title, hint, children }: {
  icon: typeof BookOpen; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-baseline gap-2 px-4 sm:px-5 pt-4 pb-3 border-b border-slate-800/80">
        <Icon size={14} className="text-blue-400 shrink-0 translate-y-0.5" />
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {hint && <span className="text-xs text-slate-600 truncate">{hint}</span>}
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </section>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-slate-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">{label}</p>
        <p className="text-xs text-slate-300 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function Bullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={clsx("space-y-1.5", className)}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
          <span className="text-slate-700 shrink-0">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Notes (per study, localStorage) ───────────────────────
function NotesBox({ issueKey }: { issueKey: string }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload whenever the selected study changes — one note per ticket.
  useEffect(() => { setValue(getStudyNotes()[issueKey] ?? ""); setSaved(false); }, [issueKey]);

  function onChange(next: string) {
    setValue(next);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveStudyNote(issueKey, next);
      setSaved(true);
    }, 600);
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        placeholder="Your own notes on this ticket — questions to raise, execution reminders, findings…"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 placeholder:text-slate-700 leading-relaxed resize-y focus:outline-none focus:border-blue-600/60"
      />
      <p className="text-[10px] text-slate-600 mt-1.5">
        {saved ? "Saved" : "Saves automatically · kept on this browser only"}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function TicketStudiesPage() {
  const [selectedKey, setSelectedKey] = useState(TICKET_STUDIES[0]?.key ?? "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TICKET_STUDIES;
    return TICKET_STUDIES.filter(s =>
      s.key.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [query]);

  const study = TICKET_STUDIES.find(s => s.key === selectedKey);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen size={15} className="text-blue-400 shrink-0" />
          <h1 className="text-sm font-semibold text-slate-200 shrink-0">Ticket Studies</h1>
          <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
            {TICKET_STUDIES.length}
          </span>
        </div>
        {study && (
          <a
            href={study.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors shrink-0"
          >
            Open in JIRA <ExternalLink size={11} />
          </a>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Study list ── */}
        <aside className="lg:w-72 lg:shrink-0 lg:border-r border-b lg:border-b-0 border-slate-800 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] flex flex-col">
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search key, title or tag…"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-600/60"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-600 px-2 py-4 text-center">No study matches that.</p>
            )}
            {filtered.map(s => {
              const isActive = s.key === selectedKey;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedKey(s.key)}
                  className={clsx(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    isActive
                      ? "bg-blue-600/10 border-blue-600/40"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx("text-xs font-mono font-bold", isActive ? "text-blue-400" : "text-slate-400")}>
                      {s.key}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto shrink-0">{s.studiedAt}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">{s.title}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Reading pane ── */}
        {!study ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <BookOpen size={22} className="text-slate-700" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No study selected</p>
          </div>
        ) : (
          <StudyView study={study} />
        )}
      </div>
    </div>
  );
}

function StudyView({ study }: { study: TicketStudy }) {
  const totals = automationTotals(study);
  const hasAutomation = !!study.automation;

  return (
    <div className="flex-1 min-w-0 max-w-4xl px-4 sm:px-6 py-5 space-y-4">
      {/* Title + Jira meta */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <a
            href={study.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-mono font-bold text-blue-400 hover:text-blue-300"
          >
            {study.key} <ExternalLink size={10} />
          </a>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-700/60 text-amber-300 font-semibold">
            {study.jira.status}
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">{study.title}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
          <span>{study.jira.type}</span>
          <span className="text-slate-700">·</span>
          <span>{study.jira.priority}</span>
          {study.jira.category && (<><span className="text-slate-700">·</span><span>{study.jira.category}</span></>)}
          {study.jira.assignee && (<><span className="text-slate-700">·</span><span>Assignee {study.jira.assignee}</span></>)}
          {study.jira.reporter && (<><span className="text-slate-700">·</span><span>Reporter {study.jira.reporter}</span></>)}
          {study.jira.fixVersion && (<><span className="text-slate-700">·</span><span>Fix {study.jira.fixVersion}</span></>)}
          <span className="text-slate-700">·</span>
          <span>Studied {study.studiedAt}</span>
        </div>
      </div>

      {/* Overview */}
      <Section icon={BookOpen} title="What this ticket is about">
        <div className="space-y-2.5">
          {study.overview.map((p, i) => (
            <p key={i} className="text-xs text-slate-400 leading-relaxed">{p}</p>
          ))}
        </div>
      </Section>

      {/* Scope */}
      <Section icon={MapPin} title="Scope">
        <div className="grid sm:grid-cols-2 gap-4">
          <Meta icon={Building2}    label="Portal"      value={study.scope.portals.join(", ")} />
          <Meta icon={Layers}       label="Modules"     value={study.scope.modules.join(" · ")} />
          <Meta icon={MapPin}       label="Trigger"     value={study.scope.trigger} />
          <Meta icon={FlaskConical} label="Environment" value={study.scope.environment} />
        </div>
      </Section>

      {/* SRD */}
      {study.srd && (
        <Section icon={FileText} title="SRD" hint={`${study.srd.version} · ${study.srd.date} · ${study.srd.status}`}>
          <p className="text-[11px] font-mono text-slate-600 break-all mb-4">{study.srd.file}</p>

          <div className="space-y-2 mb-5">
            {study.srd.requirements.map(r => (
              <div key={r.id} className="flex gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono font-bold text-blue-400 shrink-0 mt-0.5">{r.id}</span>
                <p className="text-xs text-slate-300 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-red-950/20 border border-red-900/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={12} className="text-red-400" />
              <p className="text-xs font-semibold text-red-300">
                What the SRD does NOT specify ({study.srd.notSpecified.length})
              </p>
            </div>
            <Bullets items={study.srd.notSpecified} />
          </div>
        </Section>
      )}

      {/* Settled decisions */}
      {study.decisions.length > 0 && (
        <Section icon={CheckCircle2} title="Settled with the requestor" hint="treat as decided">
          <div className="space-y-2">
            {study.decisions.map((d, i) => (
              <div key={i} className="p-3 rounded-lg bg-green-950/20 border border-green-900/40">
                <p className="text-xs font-semibold text-green-300 mb-1">{d.topic}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{d.decision}</p>
                {d.note && <p className="text-xs text-slate-500 leading-relaxed mt-1.5 italic">{d.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Open items */}
      {study.openItems.length > 0 && (
        <Section icon={HelpCircle} title="Still open" hint="needs an answer before or during execution">
          <div className="space-y-2">
            {study.openItems.map((o, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40">
                <p className="text-xs font-semibold text-amber-300 mb-1">{o.question}</p>
                {o.why && <p className="text-xs text-slate-400 leading-relaxed">{o.why}</p>}
                {o.coveredBy && (
                  <p className="text-[10px] font-mono text-slate-500 mt-1.5">Covered by {o.coveredBy}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Test script */}
      {study.testScript && (
        <Section icon={ClipboardList} title="Test script" hint={`${study.testScript.total} cases`}>
          <div className="flex flex-wrap gap-2 mb-4">
            {study.testScript.blocks.map(b => (
              <div key={b.range} className={clsx("px-3 py-2 rounded-lg border", BLOCK_TONE[b.tone])}>
                <p className="text-sm font-bold leading-none">{b.count}</p>
                <p className="text-[10px] font-semibold mt-1">{b.label}</p>
                <p className="text-[10px] font-mono opacity-70">{b.range}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-mono text-slate-600 break-all">{study.testScript.path}</p>
          {study.testScript.sheet && (
            <p className="text-xs text-slate-500 mt-1">Sheets: {study.testScript.sheet}</p>
          )}

          {study.testScript.columns && (
            <div className="flex flex-wrap gap-1 mt-3">
              {study.testScript.columns.map(c => (
                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">
                  {c}
                </span>
              ))}
            </div>
          )}

          {study.testScript.conventions && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold mb-2">Conventions</p>
              <Bullets items={study.testScript.conventions} />
            </div>
          )}
        </Section>
      )}

      {/* Automation feasibility */}
      {hasAutomation && study.automation && (
        <Section icon={Bot} title="Automation feasibility">
          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.keys(VERDICT_META) as AutomationVerdict[]).map(v => {
              const m = VERDICT_META[v];
              return (
                <div key={v} className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg border", m.chip)}>
                  <m.icon size={13} />
                  <span className="text-sm font-bold">{totals[v]}</span>
                  <span className="text-[11px] font-medium">{m.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">{study.automation.intro}</p>

          <div className="space-y-2">
            {study.automation.groups.map((g, i) => {
              const m = VERDICT_META[g.verdict];
              return (
                <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", m.dot)} />
                    <p className="text-xs font-semibold text-slate-200">{g.title}</p>
                    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-semibold", m.chip)}>
                      {m.label}
                    </span>
                    <span className="text-[10px] text-slate-600">{g.cases.length} cases</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {g.cases.map(c => (
                      <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.reason}</p>
                </div>
              );
            })}
          </div>

          {study.automation.blockers.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-950/20 border border-red-900/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-red-400" />
                <p className="text-xs font-semibold text-red-300">
                  Blockers before anything runs ({study.automation.blockers.length})
                </p>
              </div>
              <Bullets items={study.automation.blockers} />
            </div>
          )}
        </Section>
      )}

      {/* Related */}
      {study.related.length > 0 && (
        <Section icon={Link2} title="Related tickets">
          <div className="flex flex-wrap gap-2">
            {study.related.map(k => (
              <span key={k} className="text-xs font-mono px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                {k}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* My notes */}
      <Section icon={StickyNote} title="My notes">
        <NotesBox issueKey={study.key} />
      </Section>
    </div>
  );
}
