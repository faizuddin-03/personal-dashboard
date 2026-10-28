"use client";
// Calendar: month / week / day / agenda views over deployments, custom
// events, Kanban due dates and to-dos (read only). The pieces live in
// components/calendar/; this file owns state and wiring only.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Undo2, X } from "lucide-react";
import { useApp } from "@/components/AppShell";
import { Deployment } from "@/lib/deployments";
import { CalendarEvent } from "@/lib/calendar-events";
import { ParsedDeploymentItem } from "@/lib/deployment-parser";
import Toolbar from "@/components/calendar/Toolbar";
import Sidebar from "@/components/calendar/Sidebar";
import MonthView from "@/components/calendar/MonthView";
import TimeGrid, { Draft } from "@/components/calendar/TimeGrid";
import AgendaView from "@/components/calendar/AgendaView";
import EventPanel from "@/components/calendar/EventPanel";
import ItemPanel from "@/components/calendar/ItemPanel";
import { DeploymentModal, PasteDeploymentModal } from "@/components/calendar/DeploymentModals";
import { CalItem, buildItems, indexByDay, matchesQuery } from "@/components/calendar/model";
import {
  MONTHS, MONTHS_SHORT, addDays, addMonths, diffDays, fmtLong, monthGrid, parts, range, startOfWeek, toHHMM, toMin,
} from "@/components/calendar/dates";
import { downloadIcs } from "@/components/calendar/ics";
import { useReminders } from "@/components/calendar/useReminders";
import {
  CalView, LayerId,
  use24h, useCalendarEvents, useDeployments, useKanbanCards, useLayers, useMedia, useRemindersOn, useTodos, useToday, useView,
  writeDeployments, writeEvents, writePref,
} from "@/components/calendar/store";
import { useJiraDeploySync } from "@/components/calendar/useJiraDeploySync";
import { setTicketScope, useTicketScope } from "@/lib/ticketScope";

type Panel =
  | { kind: "event"; initial?: CalendarEvent; occurrence?: string; draft?: Draft }
  | { kind: "item"; it: CalItem }
  | null;

interface Toast { msg: string; undo?: () => void; id: number }

export default function CalendarPage() {
  const { creds } = useApp();
  const todayStr = useToday();
  const deployments = useDeployments();
  const events = useCalendarEvents();
  const cards = useKanbanCards();
  const todos = useTodos();
  const view = useView();
  const layers = useLayers();
  const h24 = use24h();
  const remindersOn = useRemindersOn();
  const isPhone = useMedia("(max-width: 767px)");

  const [cursor, setCursor] = useState(todayStr);
  const [panel, setPanel] = useState<Panel>(null);
  const [deployModal, setDeployModal] = useState<{ initial?: Deployment } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [agendaDays, setAgendaDays] = useState(60);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useReminders(events, remindersOn);

  // ── Jira deployment calendar (one entry per ticket) ───
  const { cache: jiraCache, tickets: jiraDeploys, syncing: jiraSyncing, sync: syncJira } = useJiraDeploySync(creds, todayStr);

  const scope = useTicketScope();
  const myAccountId = creds?.accountId;
  const src = useMemo(
    () => ({ deployments, events, cards, todos, jiraDeploys, scope, myAccountId }),
    [deployments, events, cards, todos, jiraDeploys, scope, myAccountId],
  );

  // ── Visible range ─────────────────────────────────────
  const days = useMemo(() => {
    if (view === "month") return monthGrid(cursor);
    if (view === "week") return isPhone ? range(cursor, 3) : range(startOfWeek(cursor), 7);
    if (view === "day") return [cursor];
    return range(cursor, agendaDays);
  }, [view, cursor, isPhone, agendaDays]);
  const from = days[0], to = days[days.length - 1];

  const items = useMemo(() => buildItems(src, layers, from, to), [src, layers, from, to]);
  const byDay = useMemo(() => indexByDay(items, from, to), [items, from, to]);

  const miniFrom = monthGrid(cursor)[0], miniTo = addDays(miniFrom, 41);
  const busy = useMemo(() => {
    const s = new Set<string>();
    for (const it of buildItems(src, { ...layers, holidays: false }, miniFrom, miniTo)) s.add(it.date);
    return s;
  }, [src, layers, miniFrom, miniTo]);

  const weekItems = useMemo(
    () => buildItems(src, { ...layers, kanban: false, todos: false }, todayStr, addDays(todayStr, 6)),
    [src, layers, todayStr],
  );

  const q = query.trim();
  const results = useMemo(() => {
    if (!q) return [];
    const all = buildItems(src, layers, addDays(todayStr, -365), addDays(todayStr, 365)).filter(it => matchesQuery(it, q));
    // Upcoming first, then most recent past.
    const up = all.filter(i => i.endDate >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    const past = all.filter(i => i.endDate < todayStr).sort((a, b) => b.date.localeCompare(a.date));
    return [...up, ...past].slice(0, 30);
  }, [q, src, layers, todayStr]);
  const highlight = useMemo(() => (q ? (it: CalItem) => matchesQuery(it, q) : undefined), [q]);

  // ── Title ─────────────────────────────────────────────
  const title = useMemo(() => {
    const c = parts(cursor);
    if (view === "month") return `${MONTHS[c.m]} ${c.y}`;
    if (view === "day") return fmtLong(cursor);
    const a = parts(from), b = parts(to);
    if (view === "agenda") return `From ${a.day} ${MONTHS_SHORT[a.m]} ${a.y}`;
    if (a.m === b.m) return `${a.day} – ${b.day} ${MONTHS_SHORT[a.m]} ${b.y}`;
    return `${a.day} ${MONTHS_SHORT[a.m]}${a.y !== b.y ? ` ${a.y}` : ""} – ${b.day} ${MONTHS_SHORT[b.m]} ${b.y}`;
  }, [view, cursor, from, to]);

  // ── Navigation ────────────────────────────────────────
  const setView = useCallback((v: CalView) => { writePref("calendar_view", v); }, []);
  const step = useCallback((dir: 1 | -1) => {
    setCursor(c => {
      if (view === "month") return addMonths(c, dir);
      if (view === "week") return addDays(c, dir * (isPhone ? 3 : 7));
      return addDays(c, dir * (view === "agenda" ? 7 : 1));
    });
  }, [view, isPhone]);
  const goToday = useCallback(() => { setCursor(todayStr); setAgendaDays(60); }, [todayStr]);
  const openDay = useCallback((d: string) => { setCursor(d); setView("day"); }, [setView]);

  // ── Toast ─────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = (msg: string, undo?: () => void) => setToast({ msg, undo, id: Date.now() });

  // ── Writes ────────────────────────────────────────────
  function saveEvent(e: CalendarEvent) {
    const exists = events.some(x => x.id === e.id);
    writeEvents(exists ? events.map(x => (x.id === e.id ? e : x)) : [...events, e]);
    setPanel(null);
    notify(exists ? "Event updated" : "Event added");
  }
  function deleteEvent(id: string) {
    const before = events;
    writeEvents(events.filter(x => x.id !== id));
    setPanel(null);
    notify("Event deleted", () => writeEvents(before));
  }
  function skipOccurrence(id: string, date: string) {
    const before = events;
    writeEvents(events.map(x => (x.id === id ? { ...x, exceptions: [...(x.exceptions ?? []), date] } : x)));
    setPanel(null);
    notify(`Skipped ${fmtLong(date)}`, () => writeEvents(before));
  }
  function saveDeployment(d: Deployment, close = true) {
    const exists = deployments.some(x => x.id === d.id);
    writeDeployments(exists ? deployments.map(x => (x.id === d.id ? d : x)) : [...deployments, d]);
    if (close) { setDeployModal(null); setPanel(null); notify(exists ? "Deployment updated" : "Deployment scheduled"); }
    else if (panel?.kind === "item" && panel.it.dep?.id === d.id) setPanel({ kind: "item", it: { ...panel.it, dep: d, muted: d.status === "cancelled" } });
  }
  function deleteDeployment(id: string) {
    const before = deployments;
    writeDeployments(deployments.filter(x => x.id !== id));
    setPanel(null);
    notify("Deployment deleted", () => writeDeployments(before));
  }
  function applyPaste(parsed: ParsedDeploymentItem[]) {
    let updated = [...deployments];
    for (const item of parsed) {
      if (item.action === "update" && item.matchId) {
        updated = updated.map(d => d.id === item.matchId ? {
          ...d,
          ticketSummary: item.summary || d.ticketSummary,
          date: item.date, time: item.time, type: item.type, status: item.status,
          environment: item.environment || d.environment,
          notes: item.notes || d.notes,
        } : d);
      } else {
        updated.push({
          id: crypto.randomUUID(), ticketKey: "", ticketSummary: item.summary,
          date: item.date, time: item.time, type: item.type, environment: item.environment,
          deployedBy: "", rollbackPlan: "", notes: item.notes, status: item.status,
          createdAt: new Date().toISOString(),
        });
      }
    }
    const before = deployments;
    writeDeployments(updated);
    notify(`${parsed.length} deployment${parsed.length !== 1 ? "s" : ""} applied`, () => writeDeployments(before));
  }

  function moveItem(it: CalItem, date: string, start?: number) {
    if (it.dep) {
      const before = deployments;
      writeDeployments(deployments.map(d => d.id === it.dep!.id ? { ...d, date, time: start !== undefined ? toHHMM(start) : d.time } : d));
      notify(`Moved to ${fmtLong(date)}${start !== undefined ? `, ${toHHMM(start)}` : ""}`, () => writeDeployments(before));
      return;
    }
    if (it.ev) {
      const e = it.ev;
      const delta = diffDays(it.date, date);
      let patch: Partial<CalendarEvent> = { startDate: addDays(e.startDate, delta), endDate: addDays(e.endDate, delta) };
      if (start !== undefined && !e.allDay) {
        const s0 = toMin(e.startTime) ?? 0, e0 = toMin(e.endTime) ?? s0 + 60;
        const dur = Math.max(15, e0 - s0);
        patch = { ...patch, startTime: toHHMM(start), endTime: toHHMM(Math.min(start + dur, 24 * 60 - 1)) };
      }
      const before = events;
      writeEvents(events.map(x => (x.id === e.id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)));
      const series = e.recurrence && e.recurrence !== "none" ? " (whole series)" : "";
      notify(`Moved${series} to ${fmtLong(date)}${start !== undefined ? `, ${toHHMM(start)}` : ""}`, () => writeEvents(before));
    }
  }
  function resizeItem(it: CalItem, end: number) {
    if (!it.ev) return;
    const before = events;
    writeEvents(events.map(x => (x.id === it.ev!.id ? { ...x, endTime: toHHMM(Math.min(end, 24 * 60 - 1)), updatedAt: new Date().toISOString() } : x)));
    notify(`Now ends ${toHHMM(Math.min(end, 24 * 60 - 1))}`, () => writeEvents(before));
  }

  function openItem(it: CalItem) {
    if (it.ev) setPanel({ kind: "event", initial: it.ev, occurrence: it.date });
    else setPanel({ kind: "item", it });
  }
  function createOn(d: Draft) { setPanel({ kind: "event", draft: d }); }
  function newEvent() {
    const d = cursor;
    setPanel({ kind: "event", draft: { date: d, endDate: d, allDay: true } });
  }
  function toggleLayer(id: LayerId) { writePref("calendar_layers", JSON.stringify({ ...layers, [id]: !layers[id] })); }
  async function toggleReminders() {
    if (remindersOn) { writePref("calendar_reminders", "false"); return; }
    if (typeof Notification === "undefined") { notify("This browser does not support notifications"); return; }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") { notify("Notifications are blocked for this site — allow them in the browser settings"); return; }
    writePref("calendar_reminders", "true");
    notify("Reminders on — they fire while this page is open");
  }
  function exportIcs() {
    const list = items.filter(i => i.source !== "holiday" || layers.holidays);
    if (!list.length) { notify("Nothing to export in this range"); return; }
    downloadIcs(list, from, to);
    notify(`Exported ${list.length} item${list.length !== 1 ? "s" : ""}`);
  }
  function pickResult(it: CalItem) {
    setCursor(it.date);
    if (view === "agenda") setAgendaDays(60);
    openItem(it);
  }

  // ── Keyboard shortcuts ────────────────────────────────
  const modalOpen = !!panel || !!deployModal || pasteOpen || showShortcuts;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (modalOpen) { if (e.key === "Escape" && showShortcuts) setShowShortcuts(false); return; }
      const k = e.key;
      if (k === "t" || k === "T") goToday();
      else if (k === "m" || k === "M") setView("month");
      else if (k === "w" || k === "W") setView("week");
      else if (k === "d" || k === "D") setView("day");
      else if (k === "a" || k === "A") setView("agenda");
      else if (k === "ArrowLeft" || k === "j" || k === "J") step(-1);
      else if (k === "ArrowRight" || k === "k" || k === "K") step(1);
      else if (k === "n" || k === "N" || k === "c" || k === "C") setPanel({ kind: "event", draft: { date: cursor, endDate: cursor, allDay: true } });
      else if (k === "/") searchRef.current?.focus();
      else if (k === "?") setShowShortcuts(true);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, showShortcuts, goToday, setView, step, cursor]);

  const closePanel = useCallback(() => setPanel(null), []);

  return (
    <div className="flex flex-col min-h-full">
      <Toolbar
        ref={searchRef}
        title={title} view={view} isPhone={isPhone} h24={h24}
        query={query} results={results} onQuery={setQuery} onPickResult={pickResult}
        showShortcuts={showShortcuts} onShortcuts={setShowShortcuts}
        scope={scope} onScope={setTicketScope} scopeWarning={scope === "mine" && !myAccountId ? "Your Jira account id is not loaded yet — reconnect Jira in Settings." : undefined}
        onView={setView} onToday={goToday} onPrev={() => step(-1)} onNext={() => step(1)}
        onNewEvent={newEvent}
        onNewDeployment={() => setDeployModal({})}
        onPaste={() => setPasteOpen(true)}
        onExport={exportIcs}
        onToggle24h={() => writePref("calendar_24h", String(!h24))}
      />

      <div className="flex-1 px-4 sm:px-6 py-5 flex flex-col lg:flex-row gap-5 min-w-0">
        <aside className="order-2 lg:order-1 lg:w-[284px] shrink-0 min-w-0">
          <Sidebar
            cursor={cursor} todayStr={todayStr} busy={busy}
            layers={layers} onToggleLayer={toggleLayer}
            jiraSync={{ syncedAt: jiraCache?.syncedAt, error: jiraCache?.error, count: jiraDeploys.length, syncing: jiraSyncing, onSync: syncJira }}
            weekItems={weekItems} events={events}
            remindersOn={remindersOn} onToggleReminders={toggleReminders}
            onPick={d => setCursor(d)} onOpen={openItem}
          />
        </aside>

        <main className="order-1 lg:order-2 flex-1 min-w-0">
          {q && (
            <p className="mb-3 text-xs text-slate-500">
              Showing matches for <span className="text-slate-300 font-medium">“{q}”</span> — others are dimmed.
              <button onClick={() => setQuery("")} className="ml-2 text-[color:var(--accent,#3b82f6)] hover:underline">Clear</button>
            </p>
          )}
          <div key={`${view}-${isPhone}`} className="motion-safe:animate-[calfade_160ms_ease-out]">
            {view === "month" && (
              <MonthView
                cursor={cursor} todayStr={todayStr} byDay={byDay} h24={h24} compact={isPhone}
                highlight={highlight}
                onSelectDay={setCursor}
                onCreate={d => createOn({ date: d, endDate: d, allDay: true })}
                onOpen={openItem} onMove={(it, d) => moveItem(it, d)} onOpenDay={openDay}
              />
            )}
            {(view === "week" || view === "day") && (
              <TimeGrid
                days={days} todayStr={todayStr} byDay={byDay} h24={h24} hourPx={isPhone ? 44 : 48}
                highlight={highlight}
                onCreate={createOn} onOpen={openItem} onMove={moveItem} onResize={resizeItem}
                onOpenDay={openDay}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                from={from} days={days} todayStr={todayStr}
                byDay={q ? filterMap(byDay, q) : byDay}
                h24={h24} onOpen={openItem} onOpenDay={openDay}
                onMore={() => setAgendaDays(n => n + 60)}
              />
            )}
          </div>
          {!isPhone && view !== "agenda" && (
            <p className="mt-3 text-[11px] text-slate-600">
              Click a day or time to add · drag to move{view !== "month" ? " · drag across hours to set a range · drag the bottom edge to resize" : ""} · press <kbd className="px-1 rounded border border-slate-700 font-mono">?</kbd> for shortcuts
            </p>
          )}
        </main>
      </div>

      {panel?.kind === "event" && (
        <EventPanel
          key={panel.initial?.id ?? `new-${panel.draft?.date}-${panel.draft?.start}`}
          initial={panel.initial} occurrence={panel.occurrence} draft={panel.draft}
          remindersOn={remindersOn}
          onClose={closePanel} onSave={saveEvent} onDelete={deleteEvent} onSkip={skipOccurrence}
        />
      )}
      {panel?.kind === "item" && (
        <ItemPanel
          it={panel.it} h24={h24} onClose={closePanel} jiraBaseUrl={jiraCache?.baseUrl || creds?.baseUrl}
          onEditDeployment={d => { setPanel(null); setDeployModal({ initial: d }); }}
          onSaveDeployment={d => saveDeployment(d, false)}
          onDeleteDeployment={deleteDeployment}
        />
      )}
      {deployModal && (
        <DeploymentModal
          initial={deployModal.initial} creds={creds}
          onClose={() => setDeployModal(null)}
          onSave={d => saveDeployment(d)}
        />
      )}
      {pasteOpen && (
        <PasteDeploymentModal existing={deployments} onClose={() => setPasteOpen(false)} onApply={applyPaste} />
      )}

      {toast && (
        <div key={toast.id} role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 pl-4 pr-2 py-2 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl text-sm text-slate-200 max-w-[calc(100vw-2rem)]">
          <span className="truncate">{toast.msg}</span>
          {toast.undo && (
            <button onClick={() => { toast.undo!(); setToast(null); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-[color:var(--accent,#3b82f6)] hover:bg-slate-700">
              <Undo2 size={13} /> Undo
            </button>
          )}
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="p-1 rounded-lg text-slate-500 hover:text-slate-200"><X size={13} /></button>
        </div>
      )}

      <style>{`@keyframes calfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

function filterMap(m: Map<string, CalItem[]>, q: string): Map<string, CalItem[]> {
  const out = new Map<string, CalItem[]>();
  for (const [k, v] of m) { const f = v.filter(it => matchesQuery(it, q)); if (f.length) out.set(k, f); }
  return out;
}
