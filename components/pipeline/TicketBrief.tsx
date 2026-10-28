"use client";
// Ticket brief card for /pipeline/<KEY> (Faizuddin, 2026-10-27, verbatim:
// "for every ticket, need to make sure to provide these 3 main items: high
// level scope, estimated tseting time (mandays) and the modules/pages
// affected/need to cover"). Below the three columns, the Testing Scope as a
// nested outline like the team's Miro cards (2026-10-28; format:
// _reference/pipeline/miro-testing-scope-format-2026-10-28.png). Data: brief +
// briefProblems from GET /api/pipeline/tickets/[key]; schema in
// scripts/pipeline/lib/brief.mjs.
import { useState, type ReactNode } from "react";
import { ClipboardList, Clock, LayoutGrid, AlertTriangle, ListTree } from "lucide-react";
import { Inline, ConfidencePill } from "@/components/pipeline/SectionedDoc";

interface Line { text: string; numbered?: boolean; children?: Line[] }

export interface TicketBriefData {
  key?: string;
  updatedAt?: string;
  scope?: string[];
  testingScope?: { mode?: string; outline?: Line[] };
  estimate?: {
    mandays?: number;
    base?: number;
    buffer?: number;
    qaCount?: number;
    range?: number[];
    confidence?: string;
    basis?: string;
    official?: { miro?: string; jira?: string };
  };
  modules?: { module?: string; portal?: string; pages?: string[]; why?: string }[];
  sources?: string[];
}

// Readability pass (Faizuddin, 2026-10-28: "these parts are too clustered ...
// make it easily readable"): estimate as a headline strip on top, scope and
// modules full width below it, one idea per line with its lead words in bold,
// sources moved into small italic captions, and the long explanations folded.

function Box({ title, icon, children, hint }: { title: string; icon: ReactNode; children: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 sm:p-5 min-w-0">
      <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-blue-300">
        {icon}{title}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-500">· {hint}</span>}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** "(EAINT-123-study.md, Header #5)" style source notes, split off so they can be shown small. */
const SOURCE_RE = /\s*\(([^()]*(?:\.md|\.xlsx|\.docx|Header|line \d|from Miro|Miro card)[^()]*)\)\s*/gi;
function splitSource(text: string): { main: string; src: string[] } {
  const src: string[] = [];
  const main = text.replace(SOURCE_RE, (_, s: string) => { src.push(s.trim()); return " "; }).replace(/\s+—\s*$/, "").trim();
  return { main, src };
}

function SourceNote({ src }: { src: string[] }) {
  if (!src.length) return null;
  return <p className="mt-1 text-[11px] italic text-slate-500 leading-snug break-words">Source: {src.join("; ")}</p>;
}

/** Bold lead: the words before the first ":" (if short) become the line's headline. */
function LeadLine({ text }: { text: string }) {
  const at = text.indexOf(":");
  if (at > 0 && at <= 70) {
    return (
      <>
        <span className="block font-semibold text-slate-100"><Inline text={text.slice(0, at)} /></span>
        <span className="block mt-1 text-slate-400"><Inline text={text.slice(at + 1).trim()} /></span>
      </>
    );
  }
  return <span className="text-slate-200"><Inline text={text} /></span>;
}

function Scope({ lines }: { lines: string[] }) {
  const [all, setAll] = useState(false);
  const LIMIT = 5;
  const shown = all ? lines : lines.slice(0, LIMIT);
  return (
    <>
      <ol className="divide-y divide-slate-800/80">
        {shown.map((l, i) => (
          <li key={i} className="flex gap-3 py-3 first:pt-0 text-sm leading-relaxed">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-500/15 text-blue-300 text-[11px] font-semibold flex items-center justify-center tabular-nums">{i + 1}</span>
            <span className="min-w-0"><LeadLine text={l} /></span>
          </li>
        ))}
      </ol>
      {lines.length > LIMIT && (
        <button type="button" onClick={() => setAll(a => !a)} className="mt-2 text-xs font-medium text-blue-400 hover:underline">
          {all ? "Show less" : `Show ${lines.length - LIMIT} more`}
        </button>
      )}
    </>
  );
}

function OfficialRow({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  const { main, src } = splitSource(text);
  const blank = /blank|"—"|: —|^—$/.test(main) || !/\d/.test(main.replace(/cf \d+/i, ""));
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-baseline gap-3">
        <span className="w-10 shrink-0 text-xs font-semibold text-slate-400">{label}</span>
        {blank
          ? <span className="text-sm italic text-slate-500">Not given</span>
          : <span className="text-sm text-slate-200 min-w-0"><Inline text={main} /></span>}
      </div>
      <div className="pl-[3.25rem]"><SourceNote src={src} /></div>
    </div>
  );
}

function Estimate({ e }: { e: NonNullable<TicketBriefData["estimate"]> }) {
  const [basis, setBasis] = useState(false);
  const { main: basisText, src: basisSrc } = splitSource(e.basis ?? "");
  // One sentence per line reads easier than one dense paragraph.
  const basisLines = basisText.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-slate-50 tabular-nums leading-none">{e.mandays ?? "?"}</span>
          <span className="text-base text-slate-300">man-days</span>
        </div>
        {e.range?.length === 2 && <p className="mt-2 text-sm text-slate-400">Range <span className="font-semibold text-slate-200 tabular-nums">{e.range[0]} – {e.range[1]}</span></p>}
        {(typeof e.base === "number" || typeof e.buffer === "number") && (
          <p className="mt-1 text-xs text-slate-400">
            {typeof e.base === "number" && <>Base <b className="text-slate-200 tabular-nums">{e.base}</b></>}
            {typeof e.base === "number" && typeof e.buffer === "number" && " + "}
            {typeof e.buffer === "number" && <>buffer <b className="text-slate-200 tabular-nums">{e.buffer}</b></>}
          </p>
        )}
        <div className="mt-3"><ConfidencePill value={e.confidence} /></div>
      </div>
      <div className="min-w-0 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Official figure</div>
          {e.official?.miro || e.official?.jira ? (
            <div className="divide-y divide-slate-800/80">
              <OfficialRow label="Miro" text={e.official.miro} />
              <OfficialRow label="Jira" text={e.official.jira} />
            </div>
          ) : <p className="text-sm italic text-slate-500">None yet (no Miro or Jira figure).</p>}
        </div>
        {basisLines.length > 0 && (
          <div>
            <button type="button" onClick={() => setBasis(b => !b)} aria-expanded={basis}
              className="text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300">
              {basis ? "▾" : "▸"} How this was worked out
            </button>
            {basis && (
              <div className="mt-2 border-l-2 border-slate-700 pl-3">
                <ul className="space-y-1.5">
                  {basisLines.map((s, i) => <li key={i} className="text-[13px] text-slate-400 leading-relaxed"><Inline text={s} /></li>)}
                </ul>
                <SourceNote src={basisSrc} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Modules({ mods }: { mods: NonNullable<TicketBriefData["modules"]> }) {
  const [why, setWhy] = useState(false);
  const byPortal = new Map<string, typeof mods>();
  for (const m of mods) {
    const p = m.portal?.trim() || "Other";
    byPortal.set(p, [...(byPortal.get(p) ?? []), m]);
  }
  const hasWhy = mods.some(m => m.why);
  return (
    <div>
      {hasWhy && (
        <button type="button" onClick={() => setWhy(w => !w)} aria-pressed={why}
          className="mb-4 text-xs font-medium text-blue-400 hover:underline">
          {why ? "Hide what changed" : "Show what changed on each page"}
        </button>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {[...byPortal.entries()].map(([portal, list]) => (
          <div key={portal} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-sm font-bold text-blue-200">{portal}</h4>
            <div className="mt-3 space-y-4">
              {list.map((m, i) => (
                <div key={i}>
                  {(list.length > 1 || m.module !== portal) && <div className="text-[13px] font-semibold text-slate-200">{m.module}</div>}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(m.pages ?? []).map((p, j) => (
                      <span key={j} className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs">{p}</span>
                    ))}
                  </div>
                  {why && m.why && <p className="mt-2 border-l-2 border-slate-700 pl-2.5 text-xs italic text-slate-400 leading-relaxed"><Inline text={m.why} /></p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MARKERS = ["list-disc", "list-[circle]", "list-[square]"];

function Tree({ lines, depth = 0, numbered = false }: { lines: Line[]; depth?: number; numbered?: boolean }) {
  return (
    <ul className={`${numbered ? "list-[lower-roman]" : MARKERS[depth % MARKERS.length]} pl-5 ${depth === 0 ? "space-y-2" : "mt-1 space-y-1"} marker:text-slate-500`}>
      {lines.map((l, i) => (
        <li key={i} className={`text-sm leading-relaxed ${depth === 0 ? "text-slate-200 font-medium" : "text-slate-400 font-normal"}`}>
          <Inline text={l.text} />
          {!!l.children?.length && <Tree lines={l.children} depth={depth + 1} numbered={!!l.numbered} />}
        </li>
      ))}
    </ul>
  );
}

export default function TicketBrief({ brief, problems, updatedLabel }: { brief?: TicketBriefData | null; problems?: string[]; updatedLabel?: string }) {
  const scope = (brief?.scope ?? []).filter(s => typeof s === "string" && s.trim());
  const mods = (brief?.modules ?? []).filter(m => m && typeof m === "object");
  const outline = brief?.testingScope?.outline ?? [];
  const mode = brief?.testingScope?.mode;
  return (
    <section aria-label="Ticket brief" className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-base font-semibold text-slate-100">Ticket brief</h2>
        {updatedLabel && <span className="text-[11px] text-slate-500">updated {updatedLabel}</span>}
      </div>
      {!brief ? (
        <p className="text-sm text-slate-400">Brief not written yet - Scribe writes it with the related history.</p>
      ) : (
        <>
          {(problems?.length ?? 0) > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-amber-300">
              <AlertTriangle size={13} className="shrink-0 mt-px" aria-hidden />
              <span>Brief is not complete: {problems!.join("; ")}</span>
            </p>
          )}
          <Box title="Estimated testing time" icon={<Clock size={14} aria-hidden />}>
            {brief.estimate ? <Estimate e={brief.estimate} /> : <p className="text-sm text-slate-500">Not written yet.</p>}
          </Box>
          <Box title="High-level scope" icon={<ClipboardList size={14} aria-hidden />} hint={scope.length ? `${scope.length} items` : undefined}>
            {scope.length ? <Scope lines={scope} /> : <p className="text-sm text-slate-500">Not written yet.</p>}
          </Box>
          <Box title="Modules / pages to cover" icon={<LayoutGrid size={14} aria-hidden />}
            hint={mods.length ? `${mods.reduce((n, m) => n + (m.pages?.length ?? 0), 0)} pages` : undefined}>
            {mods.length ? <Modules mods={mods} /> : <p className="text-sm text-slate-500">Not written yet.</p>}
          </Box>
          <Box title={`Testing scope${mode ? ` (${mode} testing)` : ""}`} icon={<ListTree size={13} aria-hidden />}>
            {outline.length ? <Tree lines={outline} /> : <p className="text-xs text-slate-500">Not written yet - briefs written before 2026-10-28 have none.</p>}
          </Box>
        </>
      )}
    </section>
  );
}
