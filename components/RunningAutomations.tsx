"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import { EAUTO_MODULES } from "@/lib/eautoModules";

// Sidebar list of automations running right now. Faizuddin, 2026-10-22: "make
// the sidebar show status of currently running automations. and if i click it,
// it will open the page that runs the automation."
//
// Sources: every useBackgroundRuns run (its page is recorded in meta.page when
// it starts), the three hand-rolled jobs in AppShell (Insurance / Secarang
// availability, Secarang regression), and the Insurance page's own regression
// E2E run, which only leaves a localStorage flag behind.

/** Pages for runs started before meta.page was recorded, or keys that don't match their URL. */
const KEY_PAGE: Record<string, string> = {
  "eauto/user-access-regression": "/eauto/12166",
  "eauto/edereg-precheck-bulk": "/eauto/edereg-precheck",
  "eauto/edereg-precheck-jpj-codes": "/eauto/edereg-precheck",
  "secarang-plate-checker": "/eauto/secarang-plate-checker",
};

/** Extra words after the page name, for pages with more than one runner. */
const KEY_SUFFIX: Record<string, string> = {
  "eauto/user-access-regression": "User access",
  "eauto/edereg-precheck-bulk": "Bulk",
  "eauto/edereg-precheck-jpj-codes": "JPJ codes",
};

const CATALOGUE = [
  ...TICKET_AUTOMATIONS.map(t => ({ href: t.href, name: t.label })),
  ...EAUTO_MODULES.map(m => ({ href: m.href, name: m.label })),
];

function pageFor(key: string, meta: Record<string, unknown>): string {
  if (typeof meta.page === "string" && meta.page.startsWith("/")) return meta.page;
  return KEY_PAGE[key] ?? "/" + key;
}

function nameFor(href: string, key: string): string {
  const path = href.split("?")[0];
  const hit = CATALOGUE.find(c => c.href === path);
  const base = hit?.name ?? key.replace(/^eauto\//, "");
  const suffix = KEY_SUFFIX[key];
  return suffix ? `${base} · ${suffix}` : base;
}

function elapsed(fromIso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
}

/**
 * The run time, ticking once a second. It writes the text straight into the
 * element instead of through React state: a state update every second
 * interrupts Next.js page changes (a transition), so a page that takes over a
 * second to render, e.g. /tickets on first load in dev, never finished
 * ("Rendering…" forever, then the click was dropped). 2026-10-22.
 */
function Elapsed({ from }: { from: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const t = setInterval(() => { if (ref.current) ref.current.textContent = elapsed(from); }, 1000);
    return () => clearInterval(t);
  }, [from]);
  return <span ref={ref}>{elapsed(from)}</span>;
}

interface Item { id: string; name: string; href: string; startedAt?: string; stopping: boolean }

export default function RunningAutomations({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { runs, insuranceJob, secarangJob, regressionSecarangJob } = useApp();
  const [regressionE2e, setRegressionE2e] = useState(false);

  // The Insurance regression E2E run leaves only a localStorage flag. Same
  // value = no re-render, so this poll does not disturb page changes.
  useEffect(() => {
    const read = () => {
      try { setRegressionE2e(localStorage.getItem("regression_e2e_running") === "1"); } catch { /* blocked */ }
    };
    read();
    const t = setInterval(read, 5000);
    return () => clearInterval(t);
  }, []);

  const items: Item[] = Object.values(runs)
    .filter(r => r.running && !r.orphaned)
    .map(r => {
      const href = pageFor(r.key, r.meta ?? {});
      return { id: r.key, name: nameFor(href, r.key), href, startedAt: r.startedAt, stopping: r.stopping };
    });
  if (insuranceJob?.loading) items.push({ id: "insurance", name: "Insurance · eAuto availability", href: "/eauto/insurance", stopping: !!insuranceJob.stopping });
  if (secarangJob?.loading) items.push({ id: "secarang", name: "Insurance · Secarang availability", href: "/eauto/insurance", stopping: !!secarangJob.stopping });
  if (regressionSecarangJob?.loading) items.push({ id: "secarang-regression", name: "Insurance · Secarang regression", href: "/eauto/insurance", stopping: !!regressionSecarangJob.stopping });
  if (regressionE2e) items.push({ id: "regression-e2e", name: "Insurance · Regression E2E", href: "/eauto/insurance", stopping: false });

  if (items.length === 0) return null;

  return (
    <div className="px-2 pt-3">
      <div className="flex items-center gap-1.5 px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Running now
        <span className="ml-auto rounded bg-slate-800 px-1.5 py-px text-slate-400">{items.length}</span>
      </div>
      <div className="space-y-0.5">
        {items.map(it => {
          const here = pathname === it.href.split("?")[0];
          return (
            <Link
              key={it.id}
              href={it.href}
              onClick={onNavigate}
              title={`Open ${it.name}`}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                here
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800",
              )}
            >
              <Loader2 size={12} className={clsx("shrink-0 animate-spin", it.stopping ? "text-amber-400" : "text-emerald-400")} />
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              <span className={clsx("shrink-0 font-mono text-[10px] tabular-nums", it.stopping ? "text-amber-400" : "text-slate-500")}>
                {it.stopping ? "stopping" : it.startedAt ? <Elapsed from={it.startedAt} /> : "running"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
