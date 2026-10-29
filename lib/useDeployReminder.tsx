"use client";
// Deployment reminder (Faizuddin, 2026-10-22): "if the ticket is within 1 week
// of the deployment date, can you put like a notice beside the TS number or
// anywhere in the TS card, the date of the deployment". Used on the ticket
// automation pages (once, beside the page title — 2026-10-26) and in the
// TS Tracker (CR cards).
// The date comes from the ticket's Jira fix version (lib/tsTrackerDeploy.ts),
// cached in the browser and re-read from Jira at most every 6 hours.
import { useCallback, useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { useApp } from "@/components/AppShell";
import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import { loadTracker, ticketNoOf } from "@/lib/tsTrackerModel";
import { extractTsId } from "@/lib/tsTrackerSync";
import { fetchDeploySessions, loadDeployCache, type DeploySession } from "@/lib/tsTrackerDeploy";

const FETCHED_AT_KEY = "ts_tracker_deploy_cache_at";
const REFRESH_MS = 6 * 60 * 60 * 1000;
export const DEPLOY_SOON_DAYS = 7;

/** Days from today (local) to the deployment date; negative = already past. */
export function daysUntil(date: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

/** The session when it is today or within the next 7 days, else null. */
export function soon(s: DeploySession | null | undefined): DeploySession | null {
  if (!s?.date) return null;
  const n = daysUntil(s.date);
  return n >= 0 && n <= DEPLOY_SOON_DAYS ? s : null;
}

/** Key ("EAINT-12153") → session, kept fresh from Jira. */
export function useDeploySessions() {
  const { creds } = useApp();
  const [map, setMap] = useState<Record<string, DeploySession | null>>({});
  useEffect(() => {
    setMap(loadDeployCache());
    let last = 0;
    try { last = Number(localStorage.getItem(FETCHED_AT_KEY) ?? 0); } catch { /* ignore */ }
    if (!creds || Date.now() - last < REFRESH_MS) return;
    const keys = [
      ...TICKET_AUTOMATIONS.flatMap(a => a.keys),
      ...loadTracker().map(c => c.crKey),
    ];
    void fetchDeploySessions(keys, creds).then(r => {
      setMap(r.map);
      if (!r.error) { try { localStorage.setItem(FETCHED_AT_KEY, String(Date.now())); } catch { /* ignore */ } }
    });
  }, [creds]);
  const forKey = useCallback((key: string) => map[key.trim().toUpperCase()] ?? null, [map]);
  /** "12153_TS1: …" → the session of EAINT-12153. */
  const forTs = useCallback((titleOrId: string) => {
    const id = extractTsId(titleOrId);
    const t = id ? ticketNoOf(id) : null;
    return t ? map[`EAINT-${t}`] ?? null : null;
  }, [map]);
  return { forKey, forTs };
}

/** Amber notice, shown only within 7 days of the deployment (including the day itself). */
export function DeploySoonChip({ session, className = "", label }: { session: DeploySession | null | undefined; className?: string; label?: string }) {
  const s = soon(session);
  if (!s) return null;
  const n = daysUntil(s.date!);
  const day = new Date(`${s.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const when = n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
  return (
    <span title={`Fix version ${s.name}`}
      className={`inline-flex items-center gap-1 rounded border border-amber-700/60 bg-amber-950/40 px-1.5 py-px text-[10px] font-medium text-amber-300 ${className}`}>
      <Rocket size={10} /> {label ? `${label} · ` : ""}Deploys {day}{s.session ? ` · ${s.session}` : ""} ({when})
    </span>
  );
}

/**
 * The notice once, beside the page title (Faizuddin, 2026-10-26: "you dont have
 * to put in every TS. just put it at the top/the main title"). A page covering
 * two tickets shows one chip per ticket, labelled with its number.
 */
export function DeploySoonHeader({ keys }: { keys: string[] }) {
  const { forKey } = useDeploySessions();
  const shown = keys.filter(k => soon(forKey(k)));
  if (!shown.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map(k => (
        <DeploySoonChip key={k} session={forKey(k)} label={keys.length > 1 ? k.replace(/^EAINT-/, "") : undefined} />
      ))}
    </span>
  );
}
