// localStorage-backed state for the calendar, read through
// useSyncExternalStore so the page hydrates cleanly (server snapshot is
// empty) and other tabs' writes show up live. Every storage access is
// wrapped in try/catch — private windows and blocked storage just fall
// back to defaults.

import { useSyncExternalStore } from "react";
import { Deployment, getDeployments, saveDeployments } from "@/lib/deployments";
import { CalendarEvent, getCalendarEvents, saveCalendarEvents } from "@/lib/calendar-events";
import { getKanbanState, KanbanCard, KanbanState } from "@/lib/kanban";
import { getTodos, TodoItem } from "@/lib/todo";
import { todayLocal } from "@/lib/date";
import { JIRA_DEPLOY_CACHE_KEY, JiraDeployCache, readJiraDeployCache, saveJiraDeployCache } from "@/lib/jiraDeployCalendar";
import { nowMinutes } from "./dates";

type Listener = () => void;
const listeners = new Set<Listener>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

function notify() { for (const l of listeners) l(); }

function snapshot<T>(key: string, parse: (raw: string | null) => T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse(raw);
  cache.set(key, { raw, value });
  return value;
}

function useStored<T>(key: string, parse: (raw: string | null) => T, server: T): T {
  return useSyncExternalStore(subscribe, () => snapshot(key, parse), () => server);
}

// ── Data sources ──────────────────────────────────────────
const EMPTY_DEPLOYMENTS: Deployment[] = [];
const EMPTY_EVENTS: CalendarEvent[] = [];
const EMPTY_CARDS: KanbanCard[] = [];
const EMPTY_TODOS: TodoItem[] = [];

const parseDeployments = () => getDeployments();
const parseEvents = () => getCalendarEvents();
const parseCards = () => {
  const s: KanbanState = getKanbanState();
  return (["urgent", "todo", "ongoing", "on-hold", "finished"] as const).flatMap(c => s[c] ?? []);
};
const parseTodos = () => { try { return getTodos(); } catch { return EMPTY_TODOS; } };
const parseJiraDeploys = () => readJiraDeployCache();

export function useDeployments() { return useStored("deployments", parseDeployments, EMPTY_DEPLOYMENTS); }
export function useCalendarEvents() { return useStored("calendar_events", parseEvents, EMPTY_EVENTS); }
export function useKanbanCards() { return useStored("kanban_state", parseCards, EMPTY_CARDS); }
export function useTodos() { return useStored("todo_items", parseTodos, EMPTY_TODOS); }
export function useJiraDeploys() { return useStored(JIRA_DEPLOY_CACHE_KEY, parseJiraDeploys, null as JiraDeployCache | null); }

export function writeDeployments(items: Deployment[]) { saveDeployments(items); cache.delete("deployments"); notify(); }
export function writeEvents(items: CalendarEvent[]) { saveCalendarEvents(items); cache.delete("calendar_events"); notify(); }
export function writeJiraDeploys(c: JiraDeployCache) { saveJiraDeployCache(c); cache.delete(JIRA_DEPLOY_CACHE_KEY); notify(); }

// ── Preferences ───────────────────────────────────────────
export type CalView = "month" | "week" | "day" | "agenda";
export type LayerId = "jira" | "deployments" | "events" | "kanban" | "todos" | "holidays";
export type Layers = Record<LayerId, boolean>;

export const DEFAULT_LAYERS: Layers = { jira: true, deployments: true, events: true, kanban: true, todos: true, holidays: true };

const VIEWS: CalView[] = ["month", "week", "day", "agenda"];
const parseView = (raw: string | null): CalView => (VIEWS.includes(raw as CalView) ? (raw as CalView) : "month");
const parseLayers = (raw: string | null): Layers => {
  try { return { ...DEFAULT_LAYERS, ...(raw ? JSON.parse(raw) : {}) }; } catch { return DEFAULT_LAYERS; }
};
const parseBool = (raw: string | null) => raw === "true";

export function useView() { return useStored("calendar_view", parseView, "month" as CalView); }
export function useLayers() { return useStored("calendar_layers", parseLayers, DEFAULT_LAYERS); }
export function use24h() { return useStored("calendar_24h", parseBool, false); }
export function useRemindersOn() { return useStored("calendar_reminders", parseBool, false); }

export function writePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  cache.delete(key);
  notify();
}

// ── Clock ─────────────────────────────────────────────────
function subscribeClock(cb: Listener) {
  const t = setInterval(cb, 30000);
  return () => clearInterval(t);
}
/** Minutes since midnight (app timezone), refreshed every 30 s. -1 during SSR. */
export function useNowMinutes(): number {
  return useSyncExternalStore(subscribeClock, nowMinutes, () => -1);
}
/** Today's date (app timezone), refreshed every 30 s so midnight rolls over. */
export function useToday(): string {
  return useSyncExternalStore(subscribeClock, todayLocal, todayLocal);
}

// ── Theme type (for native date/time picker colours) ──────
function subscribeTheme(cb: Listener) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-type"] });
  return () => mo.disconnect();
}
export function useColorScheme(): "light" | "dark" {
  return useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.getAttribute("data-theme-type") === "light" ? "light" : "dark"),
    () => "dark",
  );
}

// ── Media query ───────────────────────────────────────────
function subscribeMedia(query: string) {
  return (cb: Listener) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
}
const mediaSubs = new Map<string, (cb: Listener) => () => void>();
export function useMedia(query: string): boolean {
  let sub = mediaSubs.get(query);
  if (!sub) { sub = subscribeMedia(query); mediaSubs.set(query, sub); }
  return useSyncExternalStore(sub, () => window.matchMedia(query).matches, () => false);
}
