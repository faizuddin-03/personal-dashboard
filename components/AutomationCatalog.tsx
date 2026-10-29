"use client";
import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Tickets, LayoutGrid, List, Rows3, AlignJustify, ArrowRight, ArrowUpDown,
  Wallet, CheckSquare, Barcode, QrCode, Building2, ClipboardList, Mail, Receipt,
  Shield, ShoppingCart, ArrowLeftRight, SearchCheck, CarFront, Server, Fingerprint, FilePlus2,
  type LucideIcon,
} from "lucide-react";
import { STATUS_LABEL, type AutomationStatus, type TicketAutomation } from "@/lib/ticketAutomations";

// The card / list catalogue behind /tickets (per-ticket automation, Faizuddin
// 2026-10-15) and /eauto (the eAuto module pages, 2026-10-21: "make the eAuto
// sidebar section have its own page, just like the tickets page"). Two
// independent toggles, both remembered per browser: layout (cards / list) and
// density (detailed / simple), plus a sort order.

const ICONS: Record<string, LucideIcon> = {
  Wallet, CheckSquare, Barcode, QrCode, Building2, ClipboardList, Mail, Receipt,
  Shield, ShoppingCart, ArrowLeftRight, SearchCheck, CarFront, Server, Fingerprint, FilePlus2,
};

const STATUS_STYLE: Record<AutomationStatus, string> = {
  automated: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  partial: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  semi: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "data-prep": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  paused: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  planned: "bg-slate-700/40 text-slate-400 border-slate-600/40 border-dashed",
};

type Layout = "cards" | "list";
type Density = "detailed" | "simple";
/** "key" = the page's own primary order (ticket no. on /tickets, name on /eauto). */
type Sort = "key-asc" | "key-desc" | "created-asc" | "created-desc";

/** First ticket number on the card — "12107 + 12327" sorts as 12107. */
export const ticketNo = (t: TicketAutomation) => Number(/\d+/.exec(t.label)?.[0] ?? 0);
export const byTicketNo = (a: TicketAutomation, b: TicketAutomation) => ticketNo(a) - ticketNo(b);
export const byName = (a: TicketAutomation, b: TicketAutomation) => a.label.localeCompare(b.label);

function sortItems(items: TicketAutomation[], sort: Sort, compareKey: (a: TicketAutomation, b: TicketAutomation) => number): TicketAutomation[] {
  const dir = sort.endsWith("asc") ? 1 : -1;
  return [...items].sort((a, b) => {
    const primary = sort.startsWith("key") ? compareKey(a, b) : a.createdAt.localeCompare(b.createdAt);
    // Same key or same date: fall back to the key, then the label.
    return dir * (primary || compareKey(a, b) || a.label.localeCompare(b.label));
  });
}

function readPrefs(storageKey: string, defaultSort: Sort): { layout: Layout; density: Density; sort: Sort } {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const p = JSON.parse(raw);
      if ((p.layout === "cards" || p.layout === "list") && (p.density === "detailed" || p.density === "simple")) {
        // "number-*" was the /tickets sort name before this page was shared.
        const sort = typeof p.sort === "string" ? p.sort.replace(/^number-/, "key-") : defaultSort;
        return { layout: p.layout, density: p.density, sort: ["key-asc", "key-desc", "created-asc", "created-desc"].includes(sort) ? sort : defaultSort };
      }
    }
  } catch { /* ignore */ }
  return { layout: "cards", density: "detailed", sort: defaultSort };
}

export default function AutomationCatalog({
  title, subtitle, icon: HeaderIcon, items: source, storageKey, keyLabels, compareKey, defaultSort = "key-desc", extra,
}: {
  title: string;
  /** Header hint; `{n}` is replaced by the item count. */
  subtitle: string;
  icon: LucideIcon;
  items: TicketAutomation[];
  storageKey: string;
  /** Labels for the key sort, e.g. ["Ticket no. (low → high)", "Ticket no. (high → low)"]. */
  keyLabels: [string, string];
  compareKey: (a: TicketAutomation, b: TicketAutomation) => number;
  defaultSort?: Sort;
  /** Extra line under each card / row, e.g. TS Tracker progress on /tickets. */
  extra?: (t: TicketAutomation) => React.ReactNode;
}) {
  const [layout, setLayout]   = useState<Layout>("cards");
  const [density, setDensity] = useState<Density>("detailed");
  const [sort, setSort]       = useState<Sort>(defaultSort);
  const [ready, setReady]     = useState(false);

  const sortLabel: Record<Sort, string> = {
    "key-asc": keyLabels[0],
    "key-desc": keyLabels[1],
    "created-asc": "Page created (oldest first)",
    "created-desc": "Page created (newest first)",
  };

  useEffect(() => { const p = readPrefs(storageKey, defaultSort); setLayout(p.layout); setDensity(p.density); setSort(p.sort); setReady(true); }, [storageKey, defaultSort]);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(storageKey, JSON.stringify({ layout, density, sort })); } catch { /* ignore */ } }, [layout, density, sort, ready, storageKey]);

  const items = sortItems(source, sort, compareKey);
  const counts = items.reduce<Record<string, number>>((m, t) => { m[t.status] = (m[t.status] ?? 0) + 1; return m; }, {});

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <HeaderIcon size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
        <span className="text-xs text-slate-600 hidden md:block">{subtitle.replace("{n}", String(items.length))}</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg pl-2 pr-1 py-0.5 text-xs text-slate-400" title="Sort order">
            <ArrowUpDown size={13} />
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="bg-transparent text-slate-200 text-xs py-1 pr-1 focus:outline-none cursor-pointer">
              {(Object.keys(sortLabel) as Sort[]).map(k => <option key={k} value={k} className="bg-slate-900">{sortLabel[k]}</option>)}
            </select>
          </label>
          <Toggle
            value={layout}
            onChange={v => setLayout(v as Layout)}
            options={[{ v: "cards", icon: LayoutGrid, label: "Cards" }, { v: "list", icon: List, label: "List" }]}
          />
          <Toggle
            value={density}
            onChange={v => setDensity(v as Density)}
            options={[{ v: "detailed", icon: Rows3, label: "Detailed" }, { v: "simple", icon: AlignJustify, label: "Simple" }]}
          />
        </div>
      </header>

      <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 border-b border-slate-800/60">
        {(Object.keys(STATUS_LABEL) as AutomationStatus[]).filter(s => counts[s]).map(s => (
          <span key={s} className={clsx("text-[11px] px-2 py-0.5 rounded-full border", STATUS_STYLE[s])}>
            {STATUS_LABEL[s]} · {counts[s]}
          </span>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-4 flex-1">
        {layout === "cards" ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {items.map(t => <Card key={t.href} t={t} detailed={density === "detailed"} extra={extra?.(t)} />)}
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {items.map(t => <Row key={t.href} t={t} detailed={density === "detailed"} extra={extra?.(t)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; icon: LucideIcon; label: string }[] }) {
  return (
    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          title={o.label}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
            value === o.v ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300",
          )}
        >
          <o.icon size={13} />
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: AutomationStatus }) {
  return <span className={clsx("text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>;
}

function Coverage({ t }: { t: TicketAutomation }) {
  if (!t.coverage) return null;
  const pct = t.coverage.total ? Math.round((t.coverage.automated / t.coverage.total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      {t.coverage.automated}/{t.coverage.total} TS
    </div>
  );
}

function Card({ t, detailed, extra }: { t: TicketAutomation; detailed: boolean; extra?: React.ReactNode }) {
  const Icon = ICONS[t.icon] ?? Tickets;
  return (
    <Link href={t.href} className="group bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-100">{t.label}</span>
            <StatusPill status={t.status} />
          </div>
          <p className={clsx("text-xs text-slate-400 mt-0.5", !detailed && "line-clamp-1")}>{t.title}</p>
        </div>
      </div>

      <p className="text-sm text-slate-300">{t.summary}</p>

      {detailed && (
        <>
          <ul className="text-xs text-slate-400 space-y-1 list-decimal pl-4">
            {t.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <dt>Module</dt><dd className="text-slate-400">{t.module}</dd>
            <dt>Portals</dt><dd className="text-slate-400">{t.portals.join(", ")}</dd>
            {t.scripts && <><dt>Scripts</dt><dd className="font-mono text-slate-400 truncate">{t.scripts}</dd></>}
            <dt>Created</dt><dd className="text-slate-400">{t.createdAt}</dd>
            <dt>Updated</dt><dd className="text-slate-400">{t.updatedAt}</dd>
          </dl>
        </>
      )}

      {extra}

      <div className="mt-auto flex items-center justify-between pt-1">
        <Coverage t={t} />
        <span className="text-xs text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">Open <ArrowRight size={12} /></span>
      </div>
    </Link>
  );
}

function Row({ t, detailed, extra }: { t: TicketAutomation; detailed: boolean; extra?: React.ReactNode }) {
  const Icon = ICONS[t.icon] ?? Tickets;
  return (
    <Link href={t.href} className="flex items-start gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800/60 transition-colors">
      <Icon size={16} className="text-indigo-300 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-100">{t.label}</span>
          <StatusPill status={t.status} />
          <span className="text-xs text-slate-500 truncate">{t.title}</span>
        </div>
        {extra && <div className="mt-1.5">{extra}</div>}
        {detailed && (
          <>
            <p className="text-sm text-slate-300 mt-1">{t.summary}</p>
            <ul className="text-xs text-slate-400 mt-1 space-y-0.5 list-decimal pl-4">
              {t.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
              <span>{t.module}</span>
              <span>{t.portals.join(", ")}</span>
              {t.scripts && <span className="font-mono">{t.scripts}</span>}
              <span>Created {t.createdAt}</span>
              <span>Updated {t.updatedAt}</span>
              <Coverage t={t} />
            </div>
          </>
        )}
      </div>
      <ArrowRight size={14} className="text-slate-600 mt-1 shrink-0" />
    </Link>
  );
}
