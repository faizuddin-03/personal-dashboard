"use client";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Workflow, Search, ChevronRight, ArrowDown, Clock, Users, Send, ShieldCheck,
  ListChecks, Ticket, HelpCircle, Network, GitBranch, X, AlertTriangle,
} from "lucide-react";
import { EAUTO_FLOW_MODULES } from "@/lib/eautoFlows";
import type { Fact, Flow, Module, Source, Trigger } from "@/lib/eautoFlows/types";

// /eauto/flows — "eAuto Flows and Modules" (Faizuddin, 2026-10-23).
// Pick a module → a flow → a trigger point, and the page draws the steps as a
// flowchart, with what the flow affects, cronjobs, who can access it, where the
// transaction goes and what QA should check. Data: lib/eautoFlows/modules/*.ts.
// Selection lives in the URL hash (#module/flow/trigger) so a link opens the
// same view.

const SOURCE_LABEL: Record<Source["kind"], string> = {
  azfar: "Azfar repo", mine: "My knowledge", jira: "Jira", miro: "Miro",
  ts: "TS workbook", askeauto: "Ask eAuto", teams: "Teams",
};
const SOURCE_STYLE: Record<Source["kind"], string> = {
  azfar: "border-violet-700/60 text-violet-300", mine: "border-sky-700/60 text-sky-300",
  jira: "border-blue-700/60 text-blue-300", miro: "border-yellow-700/60 text-yellow-300",
  ts: "border-emerald-700/60 text-emerald-300", askeauto: "border-fuchsia-700/60 text-fuchsia-300",
  teams: "border-indigo-700/60 text-indigo-300",
};

type Tab = "affects" | "cron" | "roles" | "after" | "rules" | "scope" | "tickets" | "open";
const TABS: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: "affects", label: "Affects", icon: Network },
  { id: "scope",   label: "Scope to check", icon: ListChecks },
  { id: "cron",    label: "Cronjobs", icon: Clock },
  { id: "roles",   label: "Who can access", icon: Users },
  { id: "after",   label: "After completion", icon: Send },
  { id: "rules",   label: "Business rules", icon: ShieldCheck },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "open",    label: "Open questions", icon: HelpCircle },
];

function readHash(): [string?, string?, string?] {
  if (typeof window === "undefined") return [];
  const [m, f, t] = decodeURIComponent(window.location.hash.replace(/^#/, "")).split("/");
  return [m || undefined, f || undefined, t || undefined];
}

export default function EautoFlowsPage() {
  const modules = EAUTO_FLOW_MODULES;
  const [moduleId, setModuleId] = useState<string | undefined>();
  const [flowId, setFlowId] = useState<string | undefined>();
  const [triggerId, setTriggerId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>("affects");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const apply = () => { const [m, f, t] = readHash(); setModuleId(m); setFlowId(f); setTriggerId(t); };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function go(m?: string, f?: string, t?: string) {
    setModuleId(m); setFlowId(f); setTriggerId(t);
    const h = [m, f, t].filter(Boolean).join("/");
    history.replaceState(null, "", h ? `#${h}` : location.pathname);
  }

  const mod = modules.find(m => m.id === moduleId);
  const flow = mod?.flows.find(f => f.id === flowId);
  const trigger = flow?.triggers.find(t => t.id === triggerId);

  const totals = useMemo(() => ({
    flows: modules.reduce((n, m) => n + m.flows.length, 0),
    triggers: modules.reduce((n, m) => n + m.flows.reduce((k, f) => k + f.triggers.length, 0), 0),
  }), [modules]);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Workflow size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">eAuto Flows and Modules</h1>
        <span className="text-xs text-slate-600 hidden md:block">
          {modules.length} modules · {totals.flows} flows · {totals.triggers} trigger points
        </span>
        <div className="ml-auto flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 w-full max-w-xs">
          <Search size={13} className="text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Module, flow, page, term or ticket key"
            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-full"
          />
          {query && <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300"><X size={12} /></button>}
        </div>
      </header>

      {query.trim() ? (
        <SearchResults modules={modules} query={query.trim()} onPick={(m, f, t) => { setQuery(""); go(m, f, t); }} />
      ) : (
        <>
          <Breadcrumb mod={mod} flow={flow} trigger={trigger} go={go} />
          <div className="px-4 sm:px-6 py-4 flex-1 space-y-5">
            {!mod && <ModuleGrid modules={modules} onPick={id => go(id)} />}
            {mod && !flow && <ModuleView mod={mod} modules={modules} go={go} />}
            {mod && flow && (
              <FlowView
                mod={mod} flow={flow} trigger={trigger} tab={tab} setTab={setTab}
                pickTrigger={t => go(mod.id, flow.id, t)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Breadcrumb({ mod, flow, trigger, go }: { mod?: Module; flow?: Flow; trigger?: Trigger; go: (m?: string, f?: string, t?: string) => void }) {
  const crumb = "text-xs text-slate-400 hover:text-slate-100";
  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800/60 flex flex-wrap items-center gap-1.5">
      <button className={crumb} onClick={() => go()}>All modules</button>
      {mod && <><ChevronRight size={12} className="text-slate-600" /><button className={crumb} onClick={() => go(mod.id)}>{mod.name}</button></>}
      {flow && <><ChevronRight size={12} className="text-slate-600" /><button className={crumb} onClick={() => go(mod!.id, flow.id)}>{flow.name}</button></>}
      {trigger && <><ChevronRight size={12} className="text-slate-600" /><span className="text-xs text-slate-200">{trigger.name}</span></>}
    </div>
  );
}

function PortalChips({ portals }: { portals: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {portals.map(p => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">{p}</span>)}
    </div>
  );
}

function ModuleGrid({ modules, onPick }: { modules: Module[]; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {modules.map(m => (
        <button key={m.id} onClick={() => onPick(m.id)} className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-600/60 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-slate-100">{m.name}</span>
            <span className="ml-auto text-[11px] text-slate-500">{m.flows.length} flow{m.flows.length === 1 ? "" : "s"}</span>
          </div>
          <p className="text-xs text-slate-400 mb-2 line-clamp-3">{m.summary}</p>
          <PortalChips portals={m.portals} />
        </button>
      ))}
    </div>
  );
}

function ModuleView({ mod, modules, go }: { mod: Module; modules: Module[]; go: (m?: string, f?: string, t?: string) => void }) {
  return (
    <>
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold text-slate-100">{mod.name}</h2>
          <PortalChips portals={mod.portals} />
        </div>
        <p className="text-sm text-slate-400">{mod.summary}</p>
        {!!mod.related?.length && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Linked modules:</span>
            {mod.related.map(id => {
              const r = modules.find(x => x.id === id);
              return r ? <button key={id} onClick={() => go(id)} className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-700/50 text-indigo-300 hover:bg-indigo-950">{r.name}</button> : null;
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Flows</h3>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {mod.flows.map(f => (
            <button key={f.id} onClick={() => go(mod.id, f.id)} className="text-left bg-slate-900 border border-slate-800 hover:border-indigo-600/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch size={13} className="text-indigo-400" />
                <span className="text-sm font-semibold text-slate-100">{f.name}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2 line-clamp-3">{f.summary}</p>
              <div className="flex flex-wrap gap-1">
                {f.triggers.map(t => <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{t.name}</span>)}
              </div>
            </button>
          ))}
        </div>
      </section>

      {!!mod.glossary?.length && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Terms</h3>
          <dl className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
            {mod.glossary.map(g => (
              <div key={g.term} className="text-xs"><dt className="inline font-semibold text-slate-200">{g.term}</dt> <dd className="inline text-slate-400">— {g.meaning}</dd> <Sources sources={g.sources} /></div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}

function FlowView({ mod, flow, trigger, tab, setTab, pickTrigger }: {
  mod: Module; flow: Flow; trigger?: Trigger; tab: Tab; setTab: (t: Tab) => void; pickTrigger: (id: string) => void;
}) {
  return (
    <>
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold text-slate-100">{flow.name}</h2>
          <PortalChips portals={flow.portals} />
        </div>
        <p className="text-sm text-slate-400">{flow.summary}</p>
      </section>

      {/* Flowchart: flow → trigger points → steps of the picked trigger */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[280px]">
          <div className="px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/60 text-sm font-semibold text-indigo-200">{flow.name}</div>
          <ArrowDown size={16} className="text-slate-600 my-1" />
          <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">Trigger points — pick one</div>
          <div className="flex flex-wrap justify-center gap-2">
            {flow.triggers.map(t => (
              <button
                key={t.id}
                onClick={() => pickTrigger(t.id)}
                className={clsx(
                  "px-3 py-2 rounded-lg border text-xs text-left max-w-[220px]",
                  t.id === trigger?.id ? "bg-amber-500/15 border-amber-500/70 text-amber-100" : "bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-600/60",
                )}
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{t.entry}</div>
              </button>
            ))}
          </div>

          {trigger && <TriggerChart trigger={trigger} />}
          {!trigger && flow.triggers.length > 0 && <p className="text-xs text-slate-500 mt-4">Pick a trigger point to see its steps.</p>}
        </div>
      </section>

      {/* Flow-level detail tabs */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800">
          {TABS.map(t => {
            const n = tabCount(flow, t.id);
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs",
                tab === t.id ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300",
              )}>
                <t.icon size={13} />{t.label}<span className="text-[10px] text-slate-600">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4">
          {tab === "affects" && <FactList facts={flow.affects} empty="No downstream impact recorded." />}
          {tab === "scope"   && <FactList facts={flow.scopeToCheck} empty="No QA checklist recorded." ordered />}
          {tab === "roles"   && <FactList facts={flow.roles} empty="Access not recorded." />}
          {tab === "after"   && <FactList facts={flow.afterCompletion} empty="Not recorded." />}
          {tab === "rules"   && <FactList facts={flow.rules} empty="No business rules recorded." />}
          {tab === "cron" && (flow.cronjobs.length ? (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg">
              {flow.cronjobs.map(c => (
                <div key={c.name} className="p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-amber-400" />
                    <span className="font-semibold text-slate-100">{c.name}</span>
                    <span className="text-slate-400">· {c.schedule}</span>
                    {c.unconfirmed && <Unconfirmed />}
                  </div>
                  <p className="text-slate-400 mt-1">{c.does}</p>
                  <Sources sources={c.sources} />
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-500">No cronjob recorded for this flow.</p>)}
          {tab === "tickets" && (flow.tickets.length ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Ticket</th><th className="pr-3">Date</th><th className="pr-3">State</th><th>What it changed</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {flow.tickets.map(t => (
                  <tr key={t.key} className={clsx(t.state === "legacy" && "opacity-60")}>
                    <td className="py-1.5 pr-3"><a href={`/jira/${t.key}`} className="text-blue-300 hover:underline">{t.key}</a></td>
                    <td className="pr-3 text-slate-400">{t.date ?? "—"}</td>
                    <td className="pr-3">{t.state === "legacy"
                      ? <span className="text-slate-400">legacy{t.supersededBy ? ` → ${t.supersededBy}` : ""}</span>
                      : <span className="text-emerald-300">latest</span>}</td>
                    <td className="text-slate-300">{t.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-xs text-slate-500">No tickets recorded.</p>)}
          {tab === "open" && (flow.openQuestions?.length
            ? <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300">{flow.openQuestions.map((q, i) => <li key={i}>{q}</li>)}</ol>
            : <p className="text-xs text-slate-500">None.</p>)}
        </div>
      </section>
      <p className="text-[11px] text-slate-600">Module: {mod.name}. Facts carry their source; amber “other version” boxes keep the losing side of a conflict.</p>
    </>
  );
}

function tabCount(flow: Flow, tab: Tab): number {
  switch (tab) {
    case "affects": return flow.affects.length;
    case "scope": return flow.scopeToCheck.length;
    case "cron": return flow.cronjobs.length;
    case "roles": return flow.roles.length;
    case "after": return flow.afterCompletion.length;
    case "rules": return flow.rules.length;
    case "tickets": return flow.tickets.length;
    case "open": return flow.openQuestions?.length ?? 0;
  }
}

function TriggerChart({ trigger }: { trigger: Trigger }) {
  return (
    <div className="w-full max-w-2xl mt-2">
      <div className="flex flex-col items-center">
        <ArrowDown size={16} className="text-slate-600 my-1" />
        {trigger.summary && <p className="text-xs text-slate-400 text-center mb-2">{trigger.summary}</p>}
        {trigger.steps.map((s, i) => (
          <div key={i} className="w-full flex flex-col items-center">
            <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-200 text-[10px] flex items-center justify-center">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-100">{s.title}</div>
                  {s.where && <div className="text-[11px] text-slate-500">{s.where}</div>}
                  {s.detail && <p className="text-xs text-slate-400 mt-1">{s.detail}</p>}
                  {!!s.affects?.length && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.affects.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/50 text-rose-200">affects: {a}</span>)}
                    </div>
                  )}
                  {!!s.branches?.length && (
                    <div className="mt-2 space-y-1">
                      {s.branches.map((b, j) => (
                        <div key={j} className="text-[11px] flex gap-1.5">
                          <GitBranch size={11} className="text-amber-400 mt-0.5 shrink-0" />
                          <span className="text-amber-200">{b.when}</span><span className="text-slate-500">→</span><span className="text-slate-300">{b.then}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Sources sources={s.sources} />
                </div>
              </div>
            </div>
            {i < trigger.steps.length - 1 && <ArrowDown size={16} className="text-slate-600 my-1" />}
          </div>
        ))}
        {!!trigger.affects?.length && (
          <div className="w-full mt-3 bg-rose-950/20 border border-rose-900/50 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wide text-rose-300 mb-1">Also affected by this trigger point</div>
            <FactList facts={trigger.affects} empty="" />
          </div>
        )}
      </div>
    </div>
  );
}

function Unconfirmed() {
  return <span className="inline-flex items-center gap-1 text-[10px] text-amber-300"><AlertTriangle size={10} />unconfirmed</span>;
}

function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 mt-1 align-middle">
      {sources.map((s, i) => (
        <span key={i} title={`${SOURCE_LABEL[s.kind]}: ${s.ref}${s.date ? ` (${s.date})` : ""}`}
          className={clsx("text-[9px] px-1 py-px rounded border", SOURCE_STYLE[s.kind])}>
          {SOURCE_LABEL[s.kind]}{s.kind === "jira" || s.kind === "miro" ? ` · ${s.ref.split(" ")[0]}` : ""}
        </span>
      ))}
    </span>
  );
}

function FactList({ facts, empty, ordered }: { facts: Fact[]; empty: string; ordered?: boolean }) {
  if (!facts.length) return empty ? <p className="text-xs text-slate-500">{empty}</p> : null;
  const List = ordered ? "ol" : "ul";
  return (
    <List className={clsx("space-y-2 text-xs text-slate-300 pl-5", ordered ? "list-decimal" : "list-disc")}>
      {facts.map((f, i) => (
        <li key={i}>
          <span>{f.text}</span> {f.unconfirmed && <Unconfirmed />} <Sources sources={f.sources} />
          {f.alt?.map((a, j) => (
            <div key={j} className="mt-1 border-l-2 border-amber-600/60 bg-amber-950/20 pl-2 py-1 text-amber-100/90">
              <span className="text-[10px] uppercase text-amber-400 mr-1">Other version</span>{a.text}
              {a.note && <span className="text-slate-400"> — {a.note}</span>} <Sources sources={a.sources} />
            </div>
          ))}
        </li>
      ))}
    </List>
  );
}

// Search across modules, flows, triggers, steps, terms and ticket keys.
function SearchResults({ modules, query, onPick }: { modules: Module[]; query: string; onPick: (m: string, f?: string, t?: string) => void }) {
  const q = query.toLowerCase();
  const hits: { label: string; context: string; m: string; f?: string; t?: string }[] = [];
  const has = (s?: string) => !!s && s.toLowerCase().includes(q);
  for (const m of modules) {
    if (has(m.name) || has(m.summary)) hits.push({ label: m.name, context: "Module", m: m.id });
    for (const g of m.glossary ?? []) if (has(g.term) || has(g.meaning)) hits.push({ label: g.term, context: `Term in ${m.name}: ${g.meaning}`, m: m.id });
    for (const f of m.flows) {
      if (has(f.name) || has(f.summary)) hits.push({ label: f.name, context: `Flow in ${m.name}`, m: m.id, f: f.id });
      for (const tk of f.tickets) if (has(tk.key) || has(tk.what)) hits.push({ label: tk.key, context: `${m.name} › ${f.name}: ${tk.what}`, m: m.id, f: f.id });
      for (const t of f.triggers) {
        if (has(t.name) || has(t.entry)) hits.push({ label: t.name, context: `Trigger point of ${m.name} › ${f.name}`, m: m.id, f: f.id, t: t.id });
        for (const s of t.steps) if (has(s.title) || has(s.where) || has(s.detail)) hits.push({ label: s.title, context: `Step in ${m.name} › ${f.name} › ${t.name}`, m: m.id, f: f.id, t: t.id });
      }
    }
  }
  return (
    <div className="px-4 sm:px-6 py-4">
      <p className="text-xs text-slate-500 mb-2">{hits.length} result{hits.length === 1 ? "" : "s"} for “{query}”</p>
      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
        {hits.slice(0, 200).map((h, i) => (
          <button key={i} onClick={() => onPick(h.m, h.f, h.t)} className="w-full text-left px-4 py-2.5 hover:bg-slate-900">
            <div className="text-sm text-slate-100">{h.label}</div>
            <div className="text-[11px] text-slate-500">{h.context}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
