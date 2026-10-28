// One display shape for everything the calendar shows, plus recurrence
// expansion and the per-day index the views read from.

import { Deployment, deploymentTicketKeys, DEPLOYMENT_TYPE_META } from "@/lib/deployments";
import { CalendarEvent, EVENT_CATEGORY_META, eventHex } from "@/lib/calendar-events";
import { KanbanCard } from "@/lib/kanban";
import { TodoItem } from "@/lib/todo";
import { JiraDeployTicket } from "@/lib/jiraDeployCalendar";
import { TicketScope, isMyTicket } from "@/lib/ticketScope";
import { addDays, addMonths, diffDays, parts, toMin, daysInMonth, ymd } from "./dates";
import { Holiday, MY_HOLIDAYS } from "./holidays";
import type { Layers } from "./store";

export type Source = "deployment" | "event" | "kanban" | "todo" | "holiday";

export interface CalItem {
  /** Unique per occurrence. */
  key: string;
  source: Source;
  id: string;
  title: string;
  date: string;
  endDate: string;
  /** Minutes from midnight; set only for timed single-day items. */
  start?: number;
  end?: number;
  allDay: boolean;
  hex: string;
  label: string;
  jiraKeys: string[];
  notes?: string;
  /** Can be dragged to another date/time. */
  movable: boolean;
  /** Can be resized in the time grid. */
  resizable: boolean;
  muted?: boolean;
  dep?: Deployment;
  /** A ticket from the Jira deployment calendar (read only). */
  jira?: JiraDeployTicket;
  ev?: CalendarEvent;
  card?: KanbanCard;
  todo?: TodoItem;
  holiday?: Holiday;
}

export const SOURCE_META: Record<Exclude<Source, "event">, { label: string; hex: string }> = {
  deployment: { label: "Deployments", hex: "#8b5cf6" },
  kanban:     { label: "Kanban due",  hex: "#6366f1" },
  todo:       { label: "To-dos",      hex: "#06b6d4" },
  holiday:    { label: "Public holidays (MY)", hex: "#ef4444" },
};

export const DEPLOY_HEX = { day: "#0ea5e9", night: "#8b5cf6" } as const;

const DEPLOY_MIN = 60;

/** Colour for a Jira release with no 🌞/🌚 marker in its name. */
export const DEPLOY_HEX_UNSET = "#64748b";
/** Colour for a release that runs both sessions ("🌞/🌚"). */
export const DEPLOY_HEX_BOTH = "#f59e0b";
export const SESSION_ICON = { Morning: "🌞", Night: "🌙", Both: "🌞🌙" } as const;
const SESSION_HEX = { Morning: DEPLOY_HEX.day, Night: DEPLOY_HEX.night, Both: DEPLOY_HEX_BOTH } as const;

/** All-day: Jira gives the session, not a clock time, so none is shown. */
function jiraDeployItem(t: JiraDeployTicket): CalItem {
  return {
    key: `jira:${t.versionId}:${t.key}`, source: "deployment", id: `${t.versionId}:${t.key}`,
    title: `${t.session ? `${SESSION_ICON[t.session]} ` : ""}${t.key} ${t.summary}`,
    date: t.date, endDate: t.date,
    allDay: true,
    hex: t.session ? SESSION_HEX[t.session] : DEPLOY_HEX_UNSET,
    label: t.session === "Both" ? "Morning + night deployment" : t.session ? `${t.session} deployment` : "Deployment · session not set",
    jiraKeys: [t.key],
    movable: false, resizable: false,
    jira: t,
  };
}

function deploymentItem(d: Deployment): CalItem {
  const start = toMin(d.time);
  return {
    key: `dep:${d.id}`, source: "deployment", id: d.id,
    title: d.ticketSummary || d.ticketKey || "Deployment",
    date: d.date, endDate: d.date,
    start, end: start !== undefined ? Math.min(24 * 60, start + DEPLOY_MIN) : undefined,
    allDay: start === undefined,
    hex: DEPLOY_HEX[d.type] ?? DEPLOY_HEX.day,
    label: DEPLOYMENT_TYPE_META[d.type]?.label ?? "Deployment",
    jiraKeys: deploymentTicketKeys(d),
    notes: d.notes,
    movable: true, resizable: false,
    muted: d.status === "cancelled",
    dep: d,
  };
}

function eventOccurrence(e: CalendarEvent, date: string, span: number): CalItem {
  const start = e.allDay ? undefined : toMin(e.startTime);
  let end = e.allDay ? undefined : toMin(e.endTime);
  if (start !== undefined && (end === undefined || end <= start)) end = Math.min(24 * 60, start + 60);
  const multi = span > 0;
  return {
    key: `ev:${e.id}:${date}`, source: "event", id: e.id,
    title: e.title, date, endDate: addDays(date, span),
    start: multi ? undefined : start, end: multi ? undefined : end,
    allDay: e.allDay || start === undefined || multi,
    hex: eventHex(e),
    label: e.category ? EVENT_CATEGORY_META[e.category].label : "Event",
    jiraKeys: e.jiraKey ? [e.jiraKey.toUpperCase()] : [],
    notes: e.notes,
    movable: true, resizable: !multi && start !== undefined,
    ev: e,
  };
}

/** Occurrence start dates of an event that overlap [from, to]. */
export function occurrences(e: CalendarEvent, from: string, to: string): string[] {
  const span = Math.max(0, diffDays(e.startDate, e.endDate));
  const rec = e.recurrence ?? "none";
  if (rec === "none") return e.endDate >= from && e.startDate <= to ? [e.startDate] : [];
  const until = e.recurrenceUntil && e.recurrenceUntil >= e.startDate ? e.recurrenceUntil : "9999-12-31";
  const skip = new Set(e.exceptions ?? []);
  const out: string[] = [];
  const lo = addDays(from, -span);
  if (rec === "daily" || rec === "weekly") {
    const step = rec === "daily" ? 1 : 7;
    let k = Math.max(0, Math.ceil(diffDays(e.startDate, lo) / step));
    for (let i = 0; i < 1000; i++, k++) {
      const d = addDays(e.startDate, k * step);
      if (d > to || d > until) break;
      if (!skip.has(d)) out.push(d);
    }
  } else {
    const { day } = parts(e.startDate);
    const s = parts(e.startDate), f = parts(lo);
    let k = Math.max(0, (f.y - s.y) * 12 + (f.m - s.m) - 1);
    for (let i = 0; i < 400; i++, k++) {
      const first = addMonths(ymd(s.y, s.m, 1), k);
      const p = parts(first);
      if (day > daysInMonth(p.y, p.m)) continue;
      const d = ymd(p.y, p.m, day);
      if (d > to || d > until) break;
      if (d >= lo && !skip.has(d)) out.push(d);
    }
  }
  return out;
}

export interface Sources {
  deployments: Deployment[];
  events: CalendarEvent[];
  cards: KanbanCard[];
  todos: TodoItem[];
  jiraDeploys: JiraDeployTicket[];
  /**
   * Global All / My tickets filter (lib/ticketScope.ts). Every Jira-ticket
   * source added to buildItems must be filtered with isMyTicket() below.
   */
  scope: TicketScope;
  myAccountId?: string;
}

/** All items overlapping [from, to], respecting layer toggles. */
export function buildItems(src: Sources, layers: Layers, from: string, to: string): CalItem[] {
  const out: CalItem[] = [];
  if (layers.jira) {
    for (const t of src.jiraDeploys) {
      if (t.date < from || t.date > to) continue;
      if (!isMyTicket(src.scope, src.myAccountId, (t.qa ?? []).map(q => q.accountId))) continue;
      out.push(jiraDeployItem(t));
    }
  }
  if (layers.deployments) {
    for (const d of src.deployments) if (d.date >= from && d.date <= to) out.push(deploymentItem(d));
  }
  if (layers.events) {
    for (const e of src.events) {
      if (!e?.startDate) continue;
      const span = Math.max(0, diffDays(e.startDate, e.endDate || e.startDate));
      for (const d of occurrences({ ...e, endDate: e.endDate || e.startDate }, from, to)) out.push(eventOccurrence(e, d, span));
    }
  }
  if (layers.kanban) {
    for (const c of src.cards) {
      if (!c.dueDate || c.dueDate < from || c.dueDate > to || c.archived) continue;
      out.push({
        key: `kb:${c.id}`, source: "kanban", id: c.id,
        title: c.title, date: c.dueDate, endDate: c.dueDate, allDay: true,
        hex: SOURCE_META.kanban.hex, label: "Kanban due",
        jiraKeys: c.jiraKey ? [c.jiraKey] : [], notes: c.description,
        movable: false, resizable: false, muted: c.columnId === "finished", card: c,
      });
    }
  }
  if (layers.todos) {
    for (const t of src.todos) {
      if (t.done || !t.dueDate || t.dueDate < from || t.dueDate > to) continue;
      out.push({
        key: `td:${t.id}`, source: "todo", id: t.id,
        title: t.title, date: t.dueDate, endDate: t.dueDate, allDay: true,
        hex: SOURCE_META.todo.hex, label: "To-do due",
        jiraKeys: t.jiraKey ? [t.jiraKey] : [],
        movable: false, resizable: false, todo: t,
      });
    }
  }
  if (layers.holidays) {
    MY_HOLIDAYS.forEach((h, i) => {
      if (h.date < from || h.date > to) return;
      out.push({
        key: `hol:${h.date}:${i}`, source: "holiday", id: `${h.date}:${i}`,
        title: h.name, date: h.date, endDate: h.date, allDay: true,
        hex: SOURCE_META.holiday.hex, label: "Public holiday",
        jiraKeys: [], movable: false, resizable: false, holiday: h,
      });
    });
  }
  return out.sort(compareItems);
}

const SOURCE_ORDER: Record<Source, number> = { holiday: 0, deployment: 1, event: 2, kanban: 3, todo: 4 };

export function compareItems(a: CalItem, b: CalItem): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const ta = a.start ?? -1, tb = b.start ?? -1;
  if (ta !== tb) return ta - tb;
  return SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source] || a.title.localeCompare(b.title);
}

/** date → items covering that date (multi-day items appear on each day). */
export function indexByDay(items: CalItem[], from: string, to: string): Map<string, CalItem[]> {
  const map = new Map<string, CalItem[]>();
  for (const it of items) {
    let d = it.date < from ? from : it.date;
    const last = it.endDate > to ? to : it.endDate;
    for (let i = 0; d <= last && i < 400; i++, d = addDays(d, 1)) {
      const list = map.get(d) ?? [];
      list.push(it);
      map.set(d, list);
    }
  }
  for (const list of map.values()) list.sort(compareItems);
  return map;
}

export function matchesQuery(it: CalItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    it.title, it.notes ?? "", it.label, ...it.jiraKeys,
    it.dep?.fixVersion ?? "", it.jira?.version ?? "", it.jira?.status ?? "", it.dep?.environment ?? "", it.dep?.deployedBy ?? "",
  ].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}

// ── Leave: shown as a yellow day cell, not a pill (Faizuddin, 2026-10-26) ──
export const LEAVE_HEX = "#eab308";

export function isLeaveItem(it: CalItem): boolean {
  return it.ev?.category === "leave";
}

/**
 * Background for a day with leave: whole cell for full day, top half for AM,
 * bottom half for PM. Full day wins when a day has both.
 */
export function leaveCellBg(leaves: CalItem[], pct = 22): string | undefined {
  if (!leaves.length) return undefined;
  const c = `color-mix(in srgb, ${LEAVE_HEX} ${pct}%, transparent)`;
  const halves = new Set(leaves.map(l => (l.ev?.leaveDuration === "half" ? l.ev.leaveHalf ?? "am" : "full")));
  if (halves.has("full") || (halves.has("am") && halves.has("pm"))) return c;
  return halves.has("am") ? `linear-gradient(to bottom, ${c} 50%, transparent 50%)` : `linear-gradient(to bottom, transparent 50%, ${c} 50%)`;
}

/** Short cell label: "Leave", "Leave · AM", "Leave · PM". */
export function leaveCellLabel(l: CalItem): string {
  return l.ev?.leaveDuration === "half" ? `Leave · ${(l.ev.leaveHalf ?? "am").toUpperCase()}` : "Leave";
}

/** Translucent fill for a pill, readable on any theme. */
export function tint(hex: string, pct = 16): string {
  return `color-mix(in srgb, ${hex} ${pct}%, transparent)`;
}
/** Solid-ish fill for blocks that overlap in the time grid. */
export function tintSolid(hex: string, pct = 22): string {
  return `color-mix(in srgb, ${hex} ${pct}%, var(--bg-page, #020617))`;
}
