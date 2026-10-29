"use client";
// Bottom-left of the sidebar: every agent working right now, as
// "<character sprite> - <ticket>" (Faizuddin, 2026-10-27: "so that i know at
// all time, the agents are doing what"). Covers pipeline jobs and the
// scheduled Scout / Scribe runs. Shows nothing when everyone is resting.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CharacterSprite from "@/components/pipeline/CharacterSprite";
import type { Character, PipelineJob } from "@/lib/pipeline/types";

interface Busy { character: Character; key: string; activity: string; href: string }

const POLL_MS = 5000;
const AGENT_WORKING = new Set(["waking", "searching", "reading", "writing"]);
const AGENT_CHARACTER: Record<string, Character> = { "jira-study": "scout", "sharepoint-study": "scribe" };

export default function WorkingNow() {
  const [busy, setBusy] = useState<Busy[]>([]);

  const load = useCallback(async () => {
    const out: Busy[] = [];
    const seen = new Set<string>();
    const add = (b: Busy) => { const id = `${b.character}:${b.key}`; if (!seen.has(id)) { seen.add(id); out.push(b); } };
    try {
      const r = await fetch("/api/pipeline/jobs?active=1", { cache: "no-store" });
      if (r.ok) {
        const { jobs } = await r.json() as { jobs: PipelineJob[] };
        for (const j of jobs ?? []) add({ character: j.character, key: j.key, activity: j.activity || j.action, href: `/pipeline/${j.key}` });
      }
    } catch { /* keep the last list */ }
    // Ticket studies started from "Add ticket" run outside pipeline jobs; the
    // ticket's character state shows them (a second Scout can run alongside).
    try {
      const r = await fetch("/api/pipeline/tickets", { cache: "no-store" });
      if (r.ok) {
        const { tickets } = await r.json() as { tickets: { key: string; characters?: Partial<Record<Character, { state?: string; note?: string }>> }[] };
        for (const t of tickets ?? []) {
          for (const [c, cs] of Object.entries(t.characters ?? {}) as [Character, { state?: string; note?: string }][]) {
            if (cs?.state === "working") add({ character: c, key: t.key, activity: cs.note || "Working", href: `/pipeline/${t.key}` });
          }
        }
      }
    } catch { /* keep the last list */ }
    try {
      const r = await fetch("/api/agents/status", { cache: "no-store" });
      if (r.ok) {
        const { agents } = await r.json() as { agents: { id: string; state: string; activity: string; item: { key: string } | null }[] };
        for (const a of agents ?? []) {
          const c = AGENT_CHARACTER[a.id];
          if (c && AGENT_WORKING.has(a.state)) add({ character: c, key: a.item?.key ?? "…", activity: a.activity, href: "/agents" });
        }
      }
    } catch { /* keep the last list */ }
    setBusy(out);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (document.visibilityState === "visible") await load();
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!busy.length) return null;
  return (
    <ul aria-label="Agents working now" className="px-1 pb-1 space-y-0.5">
      {busy.map(b => (
        <li key={`${b.character}:${b.key}`}>
          <Link href={b.href} title={b.activity}
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors">
            <CharacterSprite character={b.character} size={20} busy />
            <span className="font-mono truncate">- {b.key}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
