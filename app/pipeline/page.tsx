"use client";
// Pipeline board (Faizuddin, 2026-10-27): one big shared pixel room where the
// characters fetch, work on and hand over ticket cards (BigRoom), filling the
// page; scroll down for the plain list of tickets by stage (StageList).
// Data: /api/pipeline/tickets (+ /api/pipeline/jobs for live activity), polled
// every 5 s while the tab is visible. Design: scripts/pipeline/README.md §4.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, AlertTriangle, Workflow } from "lucide-react";
import clsx from "clsx";
import CharacterSprite, { CHARACTER_INFO } from "@/components/pipeline/CharacterSprite";
import { api, normaliseKey, startPolling } from "@/components/pipeline/api";
import BigRoom from "@/components/pipeline/BigRoom";
import StageList, { needsYou, needsYouText } from "@/components/pipeline/StageList";
import { CHARACTERS } from "@/components/pipeline/bigRoomEngine";
import { type PipelineJob, type PipelineTicket } from "@/lib/pipeline/types";

/** "Needs you now" lines shown on a phone before "Show N more". */
const PHONE_NEEDS = 2;
/** Same on wider screens (r8, 2026-10-28: 12+ open questions pushed the room off the first screen). */
const DESK_NEEDS = 5;

export default function PipelineBoardPage() {
  const [tickets, setTickets] = useState<PipelineTicket[] | null>(null);
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [loadError, setLoadError] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [allNeeds, setAllNeeds] = useState(false);

  const load = useCallback(async () => {
    const [t, j] = await Promise.all([
      api<{ tickets: PipelineTicket[] }>("/api/pipeline/tickets"),
      api<{ jobs: PipelineJob[] } | PipelineJob[]>("/api/pipeline/jobs"),
    ]);
    if (t.ok) { setTickets(t.data.tickets ?? []); setLoadError(""); }
    else { setLoadError(t.error); setTickets(prev => prev ?? []); }
    if (j.ok) setJobs(Array.isArray(j.data) ? j.data : j.data.jobs ?? []);
  }, []);

  useEffect(() => {
    const first = setTimeout(() => { void load(); }, 0);
    const stop = startPolling(() => { void load(); }, () => 5000);
    return () => { clearTimeout(first); stop(); };
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const key = normaliseKey(keyInput);
    if (!key) { setAddMsg({ ok: false, text: "Type a ticket key like EAINT-12345 or just 12345." }); return; }
    setAdding(true); setAddMsg(null);
    const r = await api<{ ticket?: PipelineTicket }>("/api/pipeline/tickets", { method: "POST", json: { key } });
    setAdding(false);
    if (!r.ok) { setAddMsg({ ok: false, text: r.error }); return; }
    setAddMsg({ ok: true, text: `${key} added. Scout is studying it now; Scribe follows.` });
    setKeyInput("");
    void load();
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[16rem]">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
            <Workflow size={20} className="text-blue-400" aria-hidden /> Pipeline
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Each ticket moves from study to scenarios, automation, runs and QA-Issues. Click a character or a card to work on it.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {CHARACTERS.map(c => (
              <span key={c} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500" title={CHARACTER_INFO[c].role}>
                <CharacterSprite character={c} size={20} /> {CHARACTER_INFO[c].name}
              </span>
            ))}
          </div>
        </div>
        <form onSubmit={add} className="flex items-center gap-2">
          <label htmlFor="add-ticket" className="sr-only">Ticket key</label>
          <input
            id="add-ticket"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="EAINT-12345 or 12345"
            className="w-44 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={adding || !keyInput.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-40">
            {adding ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Plus size={14} aria-hidden />}
            Add ticket
          </button>
        </form>
      </header>

      {addMsg && (
        <p role="status" className={clsx("text-sm", addMsg.ok ? "text-green-300" : "text-red-300")}>{addMsg.text}</p>
      )}
      {loadError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-amber-300">
          <AlertTriangle size={14} aria-hidden /> {loadError}
        </p>
      )}

      {tickets === null ? (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" aria-hidden /> Loading…</p>
      ) : (
        <>
          {tickets.length === 0 && !loadError && (
            <p className="text-sm text-slate-500">No tickets yet. Scout adds your tickets after studying them, or add one above.</p>
          )}
          {tickets.some(needsYou) && (
            // One line per ticket (2026-10-28): the full question is on the ticket
            // page and in the tooltip, so the room below fits the screen.
            <section aria-label="Needs you" className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <h2 className="text-sm font-semibold text-amber-300 mb-1">Needs you now</h2>
              {/* Phones show the first PHONE_NEEDS lines and a "more" button, so the
                  room still starts on the first screen (2026-10-28, round r5). */}
              <ol className="space-y-0.5">
                {tickets.filter(needsYou).map((t, i) => (
                  <li
                    key={t.key}
                    className={clsx("items-baseline gap-x-2 text-sm min-w-0", allNeeds || i < PHONE_NEEDS ? "flex" : i < DESK_NEEDS ? "hidden md:flex" : "hidden")}
                    title={needsYouText(t)}
                  >
                    <Link href={`/pipeline/${t.key}`} className="font-mono text-blue-300 hover:underline whitespace-nowrap">{t.key}</Link>
                    <span className="text-slate-300 min-w-0 truncate">{needsYouText(t)}</span>
                  </li>
                ))}
              </ol>
              {tickets.filter(needsYou).length > PHONE_NEEDS && (
                <button
                  type="button"
                  onClick={() => setAllNeeds(v => !v)}
                  aria-expanded={allNeeds}
                  className={clsx("mt-1 text-xs text-amber-300 hover:underline", tickets.filter(needsYou).length <= DESK_NEEDS && "md:hidden")}
                >
                  {allNeeds ? "Show fewer" : <>
                    <span className="md:hidden">Show {tickets.filter(needsYou).length - PHONE_NEEDS} more</span>
                    <span className="hidden md:inline">Show {Math.max(0, tickets.filter(needsYou).length - DESK_NEEDS)} more</span>
                  </>}
                </button>
              )}
            </section>
          )}
          {/* One shared room filling the page (2026-10-27); the plain list is below. */}
          <BigRoom tickets={tickets} jobs={jobs} />
          {tickets.length > 0 && <StageList tickets={tickets} jobs={jobs} />}
        </>
      )}
    </div>
  );
}
