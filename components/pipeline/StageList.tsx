"use client";
// Simplified stage list under the big room on the pipeline board (Faizuddin,
// 2026-10-27): the room shows who is doing what; this list is the plain view
// of every ticket by stage. Compact rows; empty stages fold into one line.
import Link from "next/link";
import clsx from "clsx";
import CharacterSprite, { CHARACTER_INFO } from "@/components/pipeline/CharacterSprite";
import { ACTIVE_JOB, when } from "@/components/pipeline/api";
import { displayStage } from "@/components/pipeline/rooms";
import {
  PIPELINE_STAGES, type Character, type PipelineJob, type PipelineTicket,
} from "@/lib/pipeline/types";

const CHARACTERS: Character[] = ["scout", "scribe", "elf", "dwarf"];
const LATEST_FIRST: Character[] = ["dwarf", "elf", "scribe", "scout"];

/** One plain line saying what the ticket needs from Faizuddin. */
export function needsYouText(t: PipelineTicket): string {
  if (t.stage === "findings") return "A failed run needs your check";
  const c = LATEST_FIRST.find(x => t.characters?.[x]?.state === "waiting");
  if (!c) return "";
  const note = t.characters[c]?.note;
  return `${CHARACTER_INFO[c].name} is waiting for you${note ? `: ${note}` : ""}`;
}

export function needsYou(t: PipelineTicket): boolean {
  // The board only has finding ids, so the "findings" stage stands in for
  // "an open finding is waiting".
  return CHARACTERS.some(c => t.characters?.[c]?.state === "waiting") || t.stage === "findings";
}

function TicketRow({ t, jobs }: { t: PipelineTicket; jobs: PipelineJob[] }) {
  const job = jobs.find(j => j.key === t.key && ACTIVE_JOB(j));
  const working = job?.character ?? CHARACTERS.find(c => t.characters?.[c]?.state === "working");
  // Latest step first: Elf's open question matters more than Scribe's older one.
  const waiting = LATEST_FIRST.find(c => t.characters?.[c]?.state === "waiting");
  const errored = LATEST_FIRST.find(c => t.characters?.[c]?.state === "error");
  const who = working ?? waiting ?? errored;
  const activity = working
    ? (job?.activity || t.characters[working]?.note || "Working…")
    : waiting
      ? (t.characters[waiting]?.note || "Has a question for you")
      : errored ? (t.characters[errored]?.note || "Stopped with an error") : "";

  return (
    <li>
      <Link
        href={`/pipeline/${t.key}`}
        title={`Updated ${when(t.updatedAt)}`}
        className="block rounded-md px-2 py-1.5 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-blue-300 whitespace-nowrap">{t.key}</span>
          {needsYou(t) && <span className="w-2 h-2 shrink-0 rounded-full bg-amber-400" title="Needs you" aria-label="Needs you" />}
          <span className="text-xs text-slate-300 truncate">{t.title || "No title yet"}</span>
        </div>
        {who && (
          <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
            <CharacterSprite character={who} size={16} busy={!!working} waiting={!working && !!waiting} />
            <span className={clsx("text-[11px] truncate", errored && !working && !waiting ? "text-red-300" : "text-slate-500")}>
              <span className="text-slate-400">{CHARACTER_INFO[who].name}:</span> {activity}
            </span>
          </div>
        )}
      </Link>
    </li>
  );
}

export default function StageList({ tickets, jobs }: { tickets: PipelineTicket[]; jobs: PipelineJob[] }) {
  // A card sits where its work is now: a running job moves it forward (2026-10-27).
  const stages = PIPELINE_STAGES.map(s => ({ ...s, list: tickets.filter(t => displayStage(t, jobs) === s.id) }));
  const filled = stages.filter(s => s.list.length);
  const empty = stages.filter(s => !s.list.length);
  return (
    <section aria-label="Tickets by stage" className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-300">Tickets by stage</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filled.map(s => (
          <div key={s.id} className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
            <h3 className="flex items-center justify-between px-2 pb-1 text-xs font-semibold text-slate-300">
              {s.label}
              <span className="text-[10px] font-normal text-slate-500">{s.list.length}</span>
            </h3>
            <ol className="space-y-0.5">
              {s.list.map(t => <TicketRow key={t.key} t={t} jobs={jobs} />)}
            </ol>
          </div>
        ))}
      </div>
      {empty.length > 0 && (
        <p className="text-[11px] text-slate-500">
          No tickets in: {empty.map(s => s.label).join(", ")}
        </p>
      )}
    </section>
  );
}
